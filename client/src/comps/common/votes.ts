/// <reference path="../../../typings/extern.d.ts"/>
import {Database, Txn} from "../../storage";
import * as Promise from "bluebird"

export class VoteList {
    diff: { [k:string]:number }
    list: { [k:string]:number }
    save_scheduled: any;
    constructor() {
        this.diff = {}
        this.list = null;
    }
    save = () => {
        if (!this.save_scheduled) {
            this.save_scheduled = setTimeout(this.sync, 1000);
        }        
    }
    loaded = (): boolean => {
        return !!this.list;
    }
    load = (): Promise<VoteList> => {
        var tx = window.channer.database.tx("votes");
        return tx.begin().then((txn:Txn) => {
            console.log("initialize state: call select:" + (tx === txn));
            return txn.table("votes").select();
        }).then((val:{id: string, vote: number}[]) => {
            console.log("initialize state: recv result");
            this.list = {};
            val.forEach((v: {id: string, vote: number}) => {
                console.log("initialize state: foreach:" + v.id + "|" + v.vote);
                this.list[v.id] = v.vote;
            });
            tx.commit();
            return this;
        });
    }
    get = (id: string) => {
        if (!this.list) { return 0; }
        return this.list[id] || 0;
    }
    add = (id: string, vote: number) => {
        if (!this.list) { return; }
        this.diff[id] = vote;
        this.save();
    }
    rm = (id: string) => {
        if (!this.list) { return; }
        this.diff[id] = 0;
        this.save();
    }
    sync = () => {
        var db = window.channer.database;
        var list = this.list;
        var diff = this.diff;
        this.diff = {};
        var tx = db.tx("votes");
        var p = tx.begin(() => {    //on commit
            this.list = list;
            this.save_scheduled = false;
        }, () => {                  //on abort
            for (var k in diff) {
                //this.diff[k]'s current variable is more recent.
                if (!this.diff[k]) { this.diff[k] = diff[k]; }
            }
            this.save_scheduled = false;
        });
        for (var id in diff) {
            var v = diff[id];
            if (v == 0) { //remove
                p = p.then(this.rmer(id, list));
            } else { //add
                p = p.then(this.adder(id, v, list));
            }
        }
        p.done(tx.commit);
    }
    adder(id: string, v: number, list: { [k:string]:number }): (txn: Txn) => void {
        return (txn: Txn) => {
            console.log("add:" + id);
            list[id] = v;
            return txn.table("votes").put({id: id, vote: v});            
        }
    }
    rmer(id: string, list: { [k:string]:number }): (txn: Txn) => void {
        return (txn: Txn) => {
            console.log("rm:" + id);
            delete list[id];
            return txn.table("votes").delete(id);
        }
    }
}
