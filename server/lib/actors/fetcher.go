package actors

import (
	"time"

	"../models"
	"../../yue"
	proto "../../proto"
)

func topicFetcher(start, end time.Time, locale string) ([]HotEntry, error) {
	entries := make([]HotEntry, DEFAULT_BUCKET_SIZE)
	dbm := models.DBM()
	rows, err := dbm.Query(
		dbm.Stmt(`select id,sum(param) from %s.reactions where id >= $1 and id < $2 and type = $3 group by target`), 
		yue.UUIDAt(start), yue.UUIDAt(end), proto.Model_Reaction_Topic_Vote)
	if err != nil {
		return nil, err
	}
	i := 0
	for rows.Next() {
		if cap(entries) <= len(entries) {
			tmp := make([]HotEntry, 2 * len(entries))
			entries = append(tmp, entries...)
		}
		if err := rows.Scan(&entries[i].id, &entries[i].score); err != nil {
			return nil, err
		}
		i++
	}
	return entries, nil
}
