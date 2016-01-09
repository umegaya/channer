/// <reference path="../typings/extern.d.ts"/>
export interface Task {
	(now: number): any;
}
export class Timer {
	private tasks: Array<Task>;
	private handle: number;
	static now(): number {
		return (new Date()).getTime();
	}
	constructor() {
		this.tasks = new Array<Task>();
		this.handle = null;
	}
	add = (t: Task) => {
		var idx = this.tasks.indexOf(t);
		if (idx < 0) {
			this.tasks.push(t);
		}
	}
	remove = (t: Task) => {
		var idx = this.tasks.indexOf(t);
		if (idx >= 0) {
			this.tasks.splice(idx, 1);
		}
	}
	start = (msec: number) => {
		if (!this.handle) {
			this.handle = setInterval(this.tick, msec);
		}
	}
	stop = () => {
		if (this.handle != null) {
			clearInterval(this.handle);
			this.handle = null;
		}
	}
	private tick = () => {
		var nowms : number = Timer.now();
		for (var i in this.tasks) {
			this.tasks[i](nowms);
		}
	}
}
