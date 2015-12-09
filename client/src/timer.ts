export interface Task {
	(now: number): any;
}
export class Timer {
	private tasks: Array<Task>;
	static now(): number {
		return (new Date()).getTime();
	}
	constructor() {
		this.tasks = new Array<Task>();
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
		setInterval(this.tick, msec);
	}
	private tick = () => {
		var nowms : number = Timer.now();
		for (var i in this.tasks) {
			this.tasks[i](nowms);
		}
	}
}
