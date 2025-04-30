export class StateMachine {
    constructor(initialState, states, context) {
        this.currentState = initialState;
        this.states = states;
        this.context = context;
    }
    // Exit and enter are only running/checking a single frame of the animation. Enter the first frame, and exit the last frame.
    transition(newState) {
        if (this.states[newState] && this.currentState !== newState) {
            //Exit current state
            if (this.states[this.currentState].exit) {
                this.states[this.currentState].exit.call(this.context);
            }
            //Update state
            this.currentState = newState;
            //Enter new state
            if (this.states[newState].enter) {
                this.states[newState].enter.call(this.context);
            }
        }
    }
    // Execute is updating the entire lifetime of the animation?
    update() {
        if (this.states[this.currentState].execute) {
            this.states[this.currentState].execute.call(this.context);
        }
    }
}