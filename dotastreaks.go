package main

import (
	"bytes"
	b64 "encoding/base64"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/boltdb/bolt"
	"github.com/dgrijalva/jwt-go"
	"github.com/rs/cors"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"
)

var DotaAPIKey string = string(os.Getenv("DOTA_API_KEY"))
var JWTsecret string = string(os.Getenv("JWT_SECRET"))
var ext_id string = string(os.Getenv("EXT_ID"))

const STEAM64 = 76561197960265728

/* LOGGING SETUP */

func log_init() (w *os.File) {
	f, err := os.OpenFile(log_path(), os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		fmt.Printf("Error logging file: %v\n", err)
		return &os.File{}
	}
	log.SetOutput(f)
	return f
}

func moment() string {
	return string(time.Now().Local().Format("2006 Jan, 2 15:04:05"))
}

func log_path() string {
	return "../logging/" + string(time.Now().Local().Format("2006-01-2")) + ".log"
}

/* END LOGGING SETUP */

/* DOTA API CODE */
/* Match data struct sequence */
type MatchDataAPIResponse struct {
	Result MatchStruct
}

func (mdapi *MatchDataAPIResponse) getPlayers() []Player {
	return mdapi.Result.Players
}

/* Error struct */
type APIErr struct {
	text string
}

func (err *APIErr) Error() string {
	return err.text
}

/* Match History struct sequence */
type MatchHistoryAPIResponse struct {
	Result HResultStruct
}

type HResultStruct struct {
	Status  int
	Matches []MatchStruct
}

func (mhapi *MatchHistoryAPIResponse) getMatches() []MatchStruct {
	return mhapi.Result.Matches
}

/* Comon match struct for all API calls */
type MatchStruct struct {
	Match_id    int
	Players     []Player
	Radiant_win bool
}

func (m *MatchStruct) inGame(p Player) (Player, bool) {
	players := m.Players
	for _, player := range players {
		if player.Account_id == p.Account_id {
			return player, true
		}
	}
	return Player{}, false
}

func (m *MatchStruct) ifWon(p Player) (bool, error) {
	//inline xnor func for 1 0 0 1 truth table
	xnor := func(a, b bool) bool {
		return !((a || b) && (!a || !b))
	}

	//for getting Player_slot we need to get in-game player
	in_p, ok := m.inGame(p)

	if !ok {
		return false, &APIErr{"Player not in game"}
	}

	slot := in_p.Player_slot
	//getting team val true if radiant false if dire
	team := slot>>7 == 0

	return xnor(team, m.Radiant_win), nil
}

/* Common Player struct for all API calls */
type Player struct {
	Account_id   int
	Kills        int
	Deaths       int
	Xp_per_min   int
	Gold_per_min int
	Level        int
	Player_slot  int
}

type DotaAPI struct {
	MatchDataURL    string
	MatchHistoryURL string
	Key             string
}

func (d *DotaAPI) Default() {
	*d = DotaAPI{
		MatchDataURL:    "http://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/v1",
		MatchHistoryURL: "http://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1",
		Key:             "06F92D7C6DF8F881925E1513838D2C80"}
}

func (d *DotaAPI) getMatchIDData(match_id string) (MatchDataAPIResponse, error) {
	req, _ := http.NewRequest("GET", d.MatchDataURL, nil)

	q := req.URL.Query()
	q.Add("key", d.Key)
	q.Add("match_id", match_id)
	req.URL.RawQuery = q.Encode()

	resp, err := (&http.Client{}).Do(req)

	if err != nil {
		return MatchDataAPIResponse{}, err
	}

	defer resp.Body.Close()
	body, _ := ioutil.ReadAll(resp.Body)

	var apiresp MatchDataAPIResponse
	json.Unmarshal([]byte(body), &apiresp)
	return apiresp, nil
}

func (d *DotaAPI) getMatchHistoryData(account_id string) (MatchHistoryAPIResponse, error) {
	req, _ := http.NewRequest("GET", d.MatchHistoryURL, nil)

	q := req.URL.Query()
	q.Add("key", d.Key)
	q.Add("account_id", account_id)

	req.URL.RawQuery = q.Encode()

	resp, err := (&http.Client{}).Do(req)

	if err != nil {
		return MatchHistoryAPIResponse{}, err
	}

	defer resp.Body.Close()
	body, _ := ioutil.ReadAll(resp.Body)

	var apiresp MatchHistoryAPIResponse
	json.Unmarshal([]byte(body), &apiresp)

	if apiresp.Result.Status != 1 {
		return apiresp, &APIErr{"Couldn't fetch player's data"}
	}

	return apiresp, nil
}

func (d *DotaAPI) validateID(account_id string) bool {
	var mhapi MatchHistoryAPIResponse
	mhapi, err := d.getMatchHistoryData(account_id)
	if err != nil {
		return false
	}

	//from WebAPI success if 1
	if mhapi.Result.Status == 1 {
		return true
	} else {
		return false
	}

}

/* USER FUNCTIONALITY NOW */

/* DB CODE */

func (u *User) save() error {
	db, err := bolt.Open("UserData.db", 0600, nil)

	if err != nil {
		return err
	}

	defer db.Close()

	err = db.Batch(func(tx *bolt.Tx) error {
		chs := tx.Bucket([]byte("Account_id"))
		choice := tx.Bucket([]byte("Choice"))

		if err != nil {
			return err
		}

		chs.Put([]byte(u.Channel_id), []byte(u.Account_id))

		buf := new(bytes.Buffer)
		binary.Write(buf, binary.BigEndian, u.Stats.Choice)

		choice.Put([]byte(u.Channel_id), buf.Bytes())

		return nil
	})
	return nil
}

func toBool(b []byte) []bool {
	bool_sl := make([]bool, 0, 0)
	for _, v := range b {
		if v == 1 {
			bool_sl = append(bool_sl, true)
		} else if v == 0 {
			bool_sl = append(bool_sl, false)
		}
	}
	return bool_sl
}

func readAll() ([]User, error) {
	db, err := bolt.Open("UserData.db", 0600, nil)

	if err != nil {
		return []User{}, err
	}

	defer db.Close()

	var Users []User = []User{}

	db.View(func(tx *bolt.Tx) error {
		chs := tx.Bucket([]byte("Account_id"))
		choice := tx.Bucket([]byte("Choice"))

		c := chs.Cursor()

		for k, v := c.First(); k != nil; k, v = c.Next() {
			var us = User{}

			us.Channel_id = string(k)
			us.Account_id = string(v)

			if stats := choice.Get([]byte(k)); stats != nil {
				us.Stats.Choice = toBool(stats)
			}

			Users = append(Users, us)
		}
		return nil
	})
	return Users, nil
}

/* User basic info */
type User struct {
	Account_id    string
	Channel_id    string
	Stats         DotaStats
	Last_match_id int
}

type DotaStats struct {
	Choice []bool
	Streak int
	Kills  int
	Deaths int
	GPM    int
	XPM    int
	Lvl    int
}

func (u *User) collectStats() error {
	if u.Account_id == "" {
		//skipping if now account id set
		return errors.New("No account id")
	}

	dapi := &DotaAPI{}
	dapi.Default()
	//get all matches list
	mhapi, err := dapi.getMatchHistoryData(u.Account_id)

	if err != nil {
		return err
	}

	var matches []MatchStruct = mhapi.getMatches()

	//convert string account id to integer
	acc_id, err := strconv.Atoi(u.Account_id)
	if err != nil {
		return err
	}
	//helper struct inst to compare players
	var p Player = Player{Account_id: acc_id}

	//get easy pointer to user stats
	var stats *DotaStats = &u.Stats

	//extra protection from no data
	if len(matches) == 0 {
		return errors.New("Error getting data")
	}

	//if already tracked, skip
	if matches[0].Match_id == u.Last_match_id {
		return nil
	}

	//nulify statistics for new
	//record
	newStats := DotaStats{}
	newStats.Choice = make([]bool, len(stats.Choice))
	copy(newStats.Choice, stats.Choice)
	*stats = newStats

	for _, match := range matches {
		//get extended match info from API
		//convert int id to string
		match_id := strconv.Itoa(match.Match_id)
		match_data, err := dapi.getMatchIDData(match_id)

		if err != nil {
			return err
		}

		//if won, track stats
		if won, _ := match_data.Result.ifWon(p); won {
			gamestats, _ := match_data.Result.inGame(p)
			//write data to stats
			stats.Streak += 1
			stats.Kills += gamestats.Kills
			stats.Deaths += gamestats.Deaths
			stats.Lvl += gamestats.Level
			stats.GPM += gamestats.Gold_per_min
			stats.XPM += gamestats.Xp_per_min
		} else {
			u.Last_match_id = matches[0].Match_id
			return nil
		}
	}

	return nil
}

func (u *User) convertID(id string) error {
	var long_id int64
	long_id, err := strconv.ParseInt(id, 10, 0)

	if err != nil {
		return err
	}

	if long_id <= STEAM64 {
		u.Account_id = strconv.Itoa(int(long_id))
	} else {
		u.Account_id = strconv.Itoa(int(long_id - STEAM64))
	}
	return nil
}

func findUserByChannelID(Channel_id string) *User {
	//this uses references
	for i := range Users {
		if Users[i].Channel_id == Channel_id {
			return &Users[i]
		}
	}
	return &User{}
}

/* JWT CODE */

func parseJWT(tokenString string) (jwt.MapClaims, error) {
	sDec, _ := b64.StdEncoding.DecodeString(JWTsecret)

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Don't forget to validate the alg is what you expect:
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return jwt.MapClaims{}, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}
		return sDec, nil
	})

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	} else {
		return jwt.MapClaims{}, err
	}
}

type JWTSignature struct {
	Exp     int64
	User_id string
	Role    string
}

func signToken(jwts JWTSignature) (string, error) {
	// Create a new token object, specifying signing method and the claims
	// you would like it to contain.
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"exp":     int64(jwts.Exp),
		"user_id": jwts.User_id,
		"role":    jwts.Role,
	})

	sDec, _ := b64.StdEncoding.DecodeString(JWTsecret)

	// Sign and get the complete encoded token as a string using the secret
	tokenString, err := token.SignedString(sDec)

	return tokenString, err
}

/* END JWT CODE */

/* VERIFY CODE */
/* Config stuff */
var Users []User

type ValRequest struct {
	Account_id string
	Client_id  string
	Channel_id string
}

type VResponse struct {
	Response string
}

func verify(rw http.ResponseWriter, req *http.Request) {
	var JWTtoken string = req.Header.Get("x-extension-jwt")

	if JWTtoken == "" {
		log.Printf("No JWT for %v. Aborting\n", req.RemoteAddr)
		return
	}

	var JWTclaims jwt.MapClaims
	JWTclaims, err := parseJWT(JWTtoken)

	if err != nil {
		log.Printf("Err: %v - Invalid JWT for %v. Aborting\n", err.Error(),
			req.RemoteAddr)
		return
	}

	if JWTclaims["role"] != "broadcaster" {
		log.Printf("User requesting verification: no access for %v\n",
			req.RemoteAddr)
		return
	}

	defer req.Body.Close()
	decoder := json.NewDecoder(req.Body)
	var val ValRequest
	err = decoder.Decode(&val)

	if err != nil {
		log.Printf("Error decoding request from %v\n", req.RemoteAddr)
		//if err decoding then it means that's not our caller
		return
	}

	dapi := &DotaAPI{}
	dapi.Default()
	//check whether dota gives us person with such account
	if ok := dapi.validateID(val.Account_id); !ok {
		rw.Header().Set("Content-Type", "application/json")
		js, _ := json.Marshal(VResponse{"err"})
		rw.Write(js)
		return
	}

	//using pointer to directly mainpulate user's data
	us := findUserByChannelID(val.Channel_id)

	if us.Channel_id != "" {
		err = us.convertID(val.Account_id)
		//if err converting return err
		if err != nil {
			rw.Header().Set("Content-Type", "application/json")
			js, _ := json.Marshal(VResponse{"err"})
			rw.Write(js)
			return
		}
		//if ok converting return ok
		log.Printf("Success account (%v) verification for user %v\n", val.Account_id,
			val.Channel_id)
		rw.Header().Set("Content-Type", "application/json")
		js, _ := json.Marshal(VResponse{"ok"})
		rw.Write(js)
		us.save()
		return
	}

	//append new user with channel id and account id
	//if no users were found
	*us = User{Account_id: val.Account_id,
		Channel_id: val.Channel_id}

	err = us.convertID(us.Account_id)

	//if error occured converting id, return
	if err != nil {
		rw.Header().Set("Content-Type", "application/json")
		js, _ := json.Marshal(VResponse{"err"})
		rw.Write(js)
		return
	}

	//if everything went right, send ok respone
	rw.Header().Set("Content-Type", "application/json")
	js, _ := json.Marshal(VResponse{"ok"})
	rw.Write(js)

	log.Printf("Success account (%v) verification for user %v\n", val.Account_id,
		val.Channel_id)

	us.Stats.Choice = make([]bool, 0, 0)
	us.save()
	Users = append(Users, *us)
}

/* END VERIFY CODE */

/* CONFIG CODE */

type ConfigReq struct {
	Channel_id string
	Choice     []bool
}

type ConfigResp struct {
	Required_configuration string
}

func configDone(rw http.ResponseWriter, req *http.Request) {

	var JWTtoken string = req.Header.Get("x-extension-jwt")

	if JWTtoken == "" {
		log.Printf("No JWT for %v. Aborting\n", req.RemoteAddr)
		return
	}

	var JWTclaims jwt.MapClaims
	JWTclaims, err := parseJWT(JWTtoken)

	if err != nil {
		log.Printf("Invalid JWT for %v. Aborting\n", req.RemoteAddr)
		return
	}

	if JWTclaims["role"] != "broadcaster" {
		log.Printf("User requesting verification: no access for %v\n", req.RemoteAddr)
		return
	}

	defer req.Body.Close()

	decoder := json.NewDecoder(req.Body)
	var val ConfigReq
	err = decoder.Decode(&val)

	if err != nil {
		log.Printf("Error decoding request from %v\n", req.RemoteAddr)
		return
	}

	var updUser *User = findUserByChannelID(val.Channel_id)

	if updUser.Channel_id == "" {
		log.Printf("User with channel id %v not found. Aborting for %v\n", val.Channel_id, req.RemoteAddr)
		return
	}

	//copy contents to new slice
	updUser.Stats.Choice = make([]bool, len(val.Choice))
	copy(updUser.Stats.Choice, val.Choice)

	updUser.save()

	var signature = JWTSignature{Exp: time.Now().Unix() + (60 * 60), User_id: "43665292",
		Role: "external"}
	tokenstr, err := signToken(signature)

	if err != nil {
		return
	}

	url := "https://api.twitch.tv/extensions/" + ext_id + "/0.0.1/required_configuration"
	auth := "Bearer " + tokenstr

	jsonStr := []byte(`{"required_configuration": "done"}`)

	r, err := http.NewRequest(http.MethodPut, url, bytes.NewBuffer(jsonStr))

	r.Header.Set("Authorization", auth)
	r.Header.Set("Client-Id", "ebfbsgj6lg9k2d4czcycledd89vrz9")
	r.Header.Set("Content-Type", "application/json")

	q := r.URL.Query()
	q.Add("channel_id", val.Channel_id)
	r.URL.RawQuery = q.Encode()

	resp, err := (&http.Client{}).Do(r)

	if (err != nil) || (resp.StatusCode != 204) {
		log.Printf("Error giving config access to %v when calling to Twitch - %v\n", val.Channel_id, req.RemoteAddr)
		return
	}

	log.Printf("Successfully set config for user %v from  %v\n", val.Channel_id, req.RemoteAddr)
}

/* END CONFIG CODE */

/* UPDATE CODE */

type UserUpdateRequest struct {
	Channel_id string
}

func userUpdate(rw http.ResponseWriter, req *http.Request) {
	var JWTtoken string = req.Header.Get("x-extension-jwt")

	if JWTtoken == "" {
		log.Printf("No JWT for %v. Aborting\n", req.RemoteAddr)
		return
	}
	var JWTclaims jwt.MapClaims
	JWTclaims, err := parseJWT(JWTtoken)

	if err != nil {
		log.Printf("Invalid JWT for %v. Aborting\n", req.RemoteAddr)
		return
	}

	if JWTclaims["role"] != "viewer" && JWTclaims["role"] != "broadcaster" {
		log.Printf("Update requested by unknown: no access for %v\n", req.RemoteAddr)
		return
	}

	defer req.Body.Close()
	decoder := json.NewDecoder(req.Body)
	var upd UserUpdateRequest
	err = decoder.Decode(&upd)

	if err != nil {
		log.Printf("Error decoding request from %v\n", req.RemoteAddr)
		return
	}

	var updUser *User = findUserByChannelID(upd.Channel_id)

	if updUser.Channel_id == "" {
		log.Printf("User with channel id %v not found. Aborting for %v\n", upd.Channel_id, req.RemoteAddr)
		return
	}

	js, err := json.Marshal(updUser.Stats)

	if err != nil {
		log.Printf("Error marshalling json for %v\n", updUser.Channel_id)
		return
	}

	rw.Header().Set("Content-Type", "application/json")
	rw.Write(js)
}

/* END UPDATE CODE */

//go routines reg update stuff
func updateInfo(us *User, done chan bool) {
	err := us.collectStats()

	if err != nil {
		log.Println(err.Error())
		done <- true
		return
	}

	us.save()
	done <- true
	return
}

func launchUpdates() {
	var count int
	for {
		doneChan := make(chan bool, len(Users))

		for i := range Users {
			//using actual user, not a copy of it
			go updateInfo(&Users[i], doneChan)
		}

		for _ = range Users {
			<-doneChan
		}
		count++
		if count%1000 == 0 {
			log.Printf("Cycle %v has gone through. Status: ok.\n", count)
		}
		time.Sleep(30 * time.Second)
	}
}

func main() {
	fmt.Println(moment())

	//close file after the end of the session
	f := log_init()
	defer f.Close()

	log.Printf("Started logging at <%v>\n", moment())
	var err error

	Users, err = readAll()

	if err != nil {
		fmt.Println(err.Error())
		return
	}

	fmt.Printf("DB loaded with %v users.\n", len(Users))

	mux := http.NewServeMux()

	mux.HandleFunc("/verify", verify)
	mux.HandleFunc("/config", configDone)
	mux.HandleFunc("/userUpdate", userUpdate)

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s - %s - %s\n", r.RemoteAddr, r.Method, r.URL)
	})

	//support static file serve for htmls
	mux.HandleFunc("/frontend/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, r.URL.Path[1:])
	})
	//support static file for pictures
	mux.HandleFunc("/images/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, r.URL.Path[1:])
	})

	go launchUpdates()

	handler := cors.AllowAll().Handler(mux)

	fmt.Println("Server running!")
	err = http.ListenAndServeTLS(":443", "dotastreaks.crt", "dotastreaks.key", handler)

	if err != nil {
		fmt.Println(err.Error())
		return
	}
}
