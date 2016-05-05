package actors

import (
	"testing"

	"os"
	"time"
	"sync"
	"math/rand"

	"../yue"
	proto "../../proto"
)

const (
	ENTRY_PER_FETCH = 20000
	NEWLY_ADD_RATE = 0.3
)

var node *Node = &yue.Node {
	Seed: 1,
}

var estimates []*bucket = make([]*bucket, 0)
var mutex sync.Mutex 

func testInmemFetcher(start, end time.Time, locale string) ([]entry, error) {
	entries := make([]entry, 0, ENTRY_PER_FETCH)
	if len(estimates) > 0 {
		sampleEntries := estimates[len(estimates) - 1].entries
		for i := 0; i < int((1 - NEWLY_ADD_RATE) * ENTRY_PER_FETCH); i++ {
			//add score to existing entry
			chosen := sampleEntries[rand.int31n(len(sampleEntries))]
			e := entries[i]
			e.id = chosen.id
			e.score = rand.int31n(100)
		}
	}
	for i := 0; i < int(NEWLY_ADD_RATE * ENTRY_PER_FETCH); i++ {
		//add new entry
		e := entries[i]
		e.id = node.GenUUID(start)
		e.score = rand.int31n(1000)
	}
	estimates = append(estimates, NewBucketByEntries(bucketType(UNIT_BUCKET), entries))
	return entries, nil
}

func TestHotActor(t *testing.T) {
	queryTypes := []proto.TopicListRequest_QueryType {
		proto.TopicListRequest_Hour,
		proto.TopicListRequest_Day,
		proto.TopicListRequest_AllTime,
	}
	blen := []int{5, 5}
	a := NewHotActorWithDetail("jp", 1, blen, testInmemFetcher);
	for i := 0; i < 6000; i++ {
		start, end := 0, 20
		t := queryTypes[rand.int31n(len(queryTypes))]
		entries, err := a.Query(t, start, end)
		if err != nil {
			t.Error(err.Error())
		} else if t == proto.TopicListRequest_Hour {
			est := NewBucket(bucketType(UNIT_BUCKET), int(ENTRY_PER_FETCH * (1 + (blen[0] - 1) * NEWLY_ADD_RATE)))
			for _, b := range estimates[len(estimates) - blen[0]:] {
				est.add(b)
			}
			est.sort()
			for i := start; i < (start + end); i++ {
				e := entries[i]
				e2 := est.entries[i]
				if e.id != e2.id || e.score != e2.score {
					t.Error("result does not match estimated %v vs %v", e, e2)
				}
			}
		}
		time.Sleep(10 * time.Millisecond)
	}
}
