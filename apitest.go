package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
)

var DotaAPIKey string = string(os.Getenv("DOTA_API_KEY"))

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

/* Comon match struct for all API calls */
type MatchStruct struct {
	Match_id    int
	Players     []Player
	Radiant_win bool
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
		Key:             DotaAPIKey}
}

func (d *DotaAPI) getMatchHistoryData(account_id string) (MatchHistoryAPIResponse, error) {
	req, _ := http.NewRequest("GET", d.MatchHistoryURL, nil)

	q := req.URL.Query()
	q.Add("key", d.Key)
	q.Add("account_id", account_id)

	req.URL.RawQuery = q.Encode()

	fmt.Println(req.URL.Path)

	resp, err := (&http.Client{}).Do(req)

	if err != nil {
		return MatchHistoryAPIResponse{}, err
	}

	defer resp.Body.Close()
	body, _ := ioutil.ReadAll(resp.Body)

	var apiresp MatchHistoryAPIResponse
	json.Unmarshal([]byte(body), &apiresp)

	fmt.Println(apiresp)

	if apiresp.Result.Status != 1 {
		return apiresp, &APIErr{"Couldn't fetch player's data"}
	}

	return apiresp, nil
}

func main() {
	var dapi = &DotaAPI{}
	dapi.Default()

	dapi.getMatchHistoryData("76561198316507970")
}
