package actors

import (
	"testing"
	//"log"

	"time"
	"sync"
	"math/rand"

	"github.com/umegaya/yue"
	proto "github.com/umegaya/channer/server/proto"
)

const (
	ENTRY_PER_FETCH = 10000
	ITER_COUNT = 10
	NEWLY_ADD_RATE = 0.3
)

var node *yue.Node = &yue.Node {}

var estimates [][]FetchResult = make([][]FetchResult, 0)
var mutex sync.Mutex 

func testInmemFetcher(start, end time.Time, locale string) ([]FetchResult, error) {
	entries := make([]FetchResult, ENTRY_PER_FETCH)
	i := 0
	if len(estimates) > 0 {
		sampleEntries := estimates[len(estimates) - 1]
		//log.Printf("sampleEntries: %v", sampleEntries)
		for ;i < int(float64(1 - NEWLY_ADD_RATE) * ENTRY_PER_FETCH); i++ {
			//add score to existing entry
			sample := sampleEntries[rand.Int31n(int32(len(sampleEntries)))]
			entries[i] = FetchResult {
				id: sample.id,
				score: uint64(rand.Int31n(100) + 1),
				parent: sample.parent,
			}
		}
	}
	for ;i < ENTRY_PER_FETCH; i++ {
		//add new entry
		entries[i] = FetchResult {
			id: proto.UUID(node.GenUUID(start)),
			score: uint64(rand.Int31n(1000) + 1),
			parent: proto.UUID(rand.Int31n(50) + 1),
		}
	}
	//log.Printf("testInmemFetcher: %v", entries)
	estimates = append(estimates, entries)
	return entries, nil
}

func testInmemPersister(at time.Time, s *hotbucketStore) error {
	return nil
}

func CheckResult(t *testing.T, entries []HotEntry, ids []proto.UUID, start, end uint64, blen []int, endIdx int) {
	summeryCount := 0
	if endIdx >= len(blen) {
		summeryCount = len(estimates)
	} else {
		summeryCount = 0
		for i := 0; i <= endIdx; i++ {
			if i > 0 {
				summeryCount = summeryCount * blen[i]
			} else {
				summeryCount = blen[0]
			}
		}
	}
	est := NewHotBucket(int(ENTRY_PER_FETCH * summeryCount))
	summeryStart := len(estimates) - summeryCount
	if summeryStart < 0 {
		summeryStart = 0
	}
	for _, r := range estimates[summeryStart:] {
		est.addResults(r)
	}
	est.sort()
	estEntries, err := est.rangeOf(ids, start, end + 1)
	if err != nil {
		t.Fatal(err.Error())
	}
	//log.Printf("check: %v %v %v\n%v\n%v", len(estimates), summeryCount, endIdx, entries, estEntries)
	for i := start; i < (start + end); i++ {
		e := entries[i]
		e2 := estEntries[i]
		if e.id != e2.id || e.score != e2.score {
			if e.id != e2.id && (i + 1) < uint64(len(estEntries)) {
				e3 := estEntries[i + 1]
				if e.score == e3.score && e.id == e3.id {
					//log.Printf("id differ because use of unstable sort %v %v", e, e3)
					i++ //next index also same score, so skip check.
					continue
				}
				t.Fatal("result does not match estimated", e, "vs", e2, e3)
			}
			t.Fatal("result does not match estimated", e, "vs", e2)
		}
	}
}

func NewTestHotActor(locale string, spanSec uint32, blen []int) (*HotActor, error) {
	return NewHotActorWithDetail(locale, spanSec, blen, true, testInmemFetcher, testInmemPersister);
}

func TestHotActor(t *testing.T) {
	queryTypes := []proto.TopicListRequest_QueryType {
		proto.TopicListRequest_Hour,
		proto.TopicListRequest_Day,
		//proto.TopicListRequest_AllTime,
	}
	blen := []int{2, 2}
	// set 4th argument to true for calling update manually.
	a, _ := NewTestHotActor("jp", 1, blen);
	for i := 0; i < ITER_COUNT; i++ {
		a.update(time.Now())
		//log.Printf("iter: %v", i)
		start, end := 0, 5
		typ := queryTypes[rand.Int31n(int32(len(queryTypes)))]
		entries, err := a.Query(typ, nil, uint64(start), uint64(end))
		if err != nil {
			t.Fatal(err.Error())
		} else if typ == proto.TopicListRequest_Hour {
			CheckResult(t, entries, nil, uint64(start), uint64(end), blen, 0)
		} else if typ == proto.TopicListRequest_Day {
			CheckResult(t, entries, nil, uint64(start), uint64(end), blen, 1)
		} else if typ == proto.TopicListRequest_AllTime {
			CheckResult(t, entries, nil, uint64(start), uint64(end), blen, 2)
		}
		//time.Sleep(1 * time.Millisecond)
	}
}
