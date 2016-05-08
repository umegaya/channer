package actors

import (
	"time"

	"github.com/umegaya/channer/server/lib/models"
	proto "github.com/umegaya/channer/server/proto"

	"github.com/umegaya/yue"
)

func topicFetcher(start, end time.Time, locale string) ([]FetchResult, error) {
	entries := make([]FetchResult, DEFAULT_HOTBUCKET_SIZE)
	dbm := models.DBM()
	rows, err := dbm.Query(
		dbm.Stmt(`select target,1,sum(param) from %s.reactions where id >= $1 and id < $2 and type = $3 group by target`), 
		yue.UUIDAt(start), yue.UUIDAt(end), proto.Model_Reaction_Topic_Vote)
	if err != nil {
		return nil, err
	}
	i := 0
	for rows.Next() {
		if cap(entries) <= len(entries) {
			tmp := make([]FetchResult, 2 * len(entries))
			entries = append(tmp, entries...)
		}
		if err := rows.Scan(&entries[i].id, &entries[i].parent, &entries[i].score); err != nil {
			return nil, err
		}
		i++
	}
	return entries, nil
}

func topicPersister(at time.Time, s *hotbucketStore) error {
	return nil
}