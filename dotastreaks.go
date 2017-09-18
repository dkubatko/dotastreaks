package main

import (
	"bytes"
	b64 "encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/dgrijalva/jwt-go"
	"io/ioutil"
	"net/http"
	"strconv"
)

const DefaultExt = ".html"
const DotaAPIKey = "06F92D7C6DF8F881925E1513838D2C80"

type Page struct {
	Title string
	Body  []byte
	Ext   string
}

/* Page methods */
func (p *Page) load(filename string, exts ...string) {
	ext := DefaultExt

	if len(exts) != 0 {
		ext = exts[0]
	}

	fn := filename + ext
	text, err := ioutil.ReadFile(fn)

	if err != nil {
		return
	}

	*p = Page{filename, text, ext}
}

func (p *Page) save() {
	fn := p.Title + p.Ext
	ioutil.WriteFile(fn, p.Body, 0600)
}

func getTestPage() *Page {
	p := &Page{Title: "test", Ext: ".html"}
	p.Body = append(p.Body, []byte("And I have written that!\n")...)
	p.save()
	return p
}

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
	Account_id  int
	Kills       int
	Deaths      int
	Player_slot int
}

/* Struct for user info */
type User struct {
	Client_id     string
	Account_id    string
	Channel_id    string
	Stats         DotaStats
	Last_match_id int
}

type DotaStats struct {
	Streak int
	Kills  int
	Deaths int
}

func (u *User) collectStats() error {
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

	for _, match := range matches {
		//if already tracked, skip
		if match.Match_id == u.Last_match_id {
			return nil
		}

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
		} else {
			u.Last_match_id = matches[0].Match_id
			return nil
		}
	}

	return nil
}

const STEAM64 = 76561197960265728

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

	if apiresp.Result.Status == 15 {
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

const JWTsecret = "GMN6U3GbKX2UionfEMqFe7Vw87/EVw96zQswj8ZH7Ow="

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
		return
	}

	var JWTclaims jwt.MapClaims
	JWTclaims, err := parseJWT(JWTtoken)

	if err != nil {
		return
	}

	if JWTclaims["role"] != "broadcaster" {
		return
	}

	defer req.Body.Close()
	decoder := json.NewDecoder(req.Body)
	var val ValRequest
	err = decoder.Decode(&val)

	if err != nil {
		return
	}

	dapi := &DotaAPI{}
	dapi.Default()
	if ok := dapi.validateID(val.Account_id); ok {
		rw.Header().Set("Content-Type", "application/json")
		js, _ := json.Marshal(VResponse{"ok"})
		rw.Write(js)
	} else {
		rw.Header().Set("Content-Type", "application/json")
		js, _ := json.Marshal(VResponse{"err"})
		rw.Write(js)
		return
	}

	//append new user with channel id and account id
	us := User{Client_id: val.Client_id, Account_id: val.Account_id,
		Channel_id: val.Channel_id}

	us.convertID(us.Account_id)
	Users = append(Users, us)
}

/* Actual update */
type UpdateRequest struct {
	id string
}

func findUserByID(Client_id string) User {
	for _, user := range Users {
		if user.Client_id == Client_id {
			return user
		}
	}
	return User{}
}

func findUserByChannelID(Channel_id string) User {
	for _, user := range Users {
		if user.Channel_id == Channel_id {
			return user
		}
	}
	return User{}
}

func update(rw http.ResponseWriter, req *http.Request) {
	var JWTtoken string = req.Header.Get("x-extension-jwt")
	var JWTclaims jwt.MapClaims
	JWTclaims, err := parseJWT(JWTtoken)

	if err != nil {
		return
	}

	if JWTclaims["role"] != "broadcaster" {
		return
	}

	decoder := json.NewDecoder(req.Body)
	var upd UpdateRequest
	err = decoder.Decode(&upd)

	if err != nil {
		return
	}

	defer req.Body.Close()

	var updUser User = findUserByID(upd.id)

	if updUser.Client_id == "" {
		fmt.Println("User not found!")
		return
	}

	err = updUser.collectStats()

	if err != nil {
		fmt.Println("Error getting data!")
		return
	}

	js, err := json.Marshal(updUser.Stats)

	if err != nil {
		fmt.Println("Error processing json!")
		return
	}

	rw.Header().Set("Content-Type", "application/json")
	rw.Write(js)
}

func userUpdate(rw http.ResponseWriter, req *http.Request) {
	var JWTtoken string = req.Header.Get("x-extension-jwt")
	var JWTclaims jwt.MapClaims
	JWTclaims, err := parseJWT(JWTtoken)

	if err != nil {
		return
	}

	if JWTclaims["role"] != "viewer" {
		return
	}

	defer req.Body.Close()
	decoder := json.NewDecoder(req.Body)
	var upd UpdateRequest
	err = decoder.Decode(&upd)

	if err != nil {
		return
	}

	var updUser User = findUserByChannelID(upd.id)

	if updUser.Client_id == "" {
		fmt.Println("User not found!")
		return
	}

	err = updUser.collectStats()

	if err != nil {
		fmt.Println("Error getting data!")
		return
	}

	js, err := json.Marshal(updUser.Stats)

	if err != nil {
		fmt.Println("Error processing json!")
		return
	}

	rw.Header().Set("Content-Type", "application/json")
	rw.Write(js)
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

type ConfigReq struct {
	Channel_id string
}

type ConfigResp struct {
	Required_configuration string
}

func configDone(rw http.ResponseWriter, req *http.Request) {

	var JWTtoken string = req.Header.Get("x-extension-jwt")

	if JWTtoken == "" {
		return
	}

	var JWTclaims jwt.MapClaims
	JWTclaims, err := parseJWT(JWTtoken)

	if err != nil {
		return
	}

	if JWTclaims["role"] != "broadcaster" {
		return
	}

	defer req.Body.Close()
	decoder := json.NewDecoder(req.Body)
	var val ConfigReq
	err = decoder.Decode(&val)

	if err != nil {
		return
	}

	var signature = JWTSignature{Exp: 1505774570, User_id: "43665292",
		Role: "external"}
	tokenstr, err := signToken(signature)

	if err != nil {
		return
	}

	jsonStr, _ := json.Marshal(ConfigResp{"done"})

	fmt.Println(string(jsonStr))

	url := "https://api.twitch.tv/extensions/277906/0.0.1/required_configuration"

	auth := "Bearer " + tokenstr

	r, err := http.NewRequest("PUT", url, bytes.NewBuffer(jsonStr))
	r.Header.Set("Authorization", auth)
	r.Header.Set("Client-Id", "ebfbsgj6lg9k2d4czcycledd89vrz9")
	r.Header.Set("Content-Type", "application/json")

	q := r.URL.Query()
	q.Add("channel_id", val.Channel_id)
	r.URL.RawQuery = q.Encode()

	resp, err := (&http.Client{}).Do(r)

	if err != nil {
		fmt.Println(err.Error())
		return
	}

	defer resp.Body.Close()
	body, _ := ioutil.ReadAll(resp.Body)

	fmt.Println(string(body))

}

func main() {
	http.HandleFunc("/update", update)
	http.HandleFunc("/verify", verify)
	http.HandleFunc("/config", configDone)

	//support static file serve for htmls
	http.HandleFunc("/frontend/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, r.URL.Path[1:])
	})
	//support static file for pictures
	http.HandleFunc("/images/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, r.URL.Path[1:])
	})

	//support static file for validation
	http.HandleFunc("/.well-known/pki-validation/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, r.URL.Path[1:])
	})

	fmt.Println("Server running!")
	err := http.ListenAndServeTLS(":443", "dotastreaks.crt", "dotastreaks.key", nil)

	if err != nil {
		fmt.Println(err.Error())
		return
	}
}
