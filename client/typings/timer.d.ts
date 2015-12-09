export interface Task {
    (now: number): any;
}
export declare class Timer {
    private tasks;
    static now(): number;
    constructor();
    add: (t: Task) => void;
    remove: (t: Task) => void;
    start: (msec: number) => void;
    private tick;
}
