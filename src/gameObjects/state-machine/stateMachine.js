export class StateMachine {
    constructor(initialState, states, context) {
        this.currentState = initialState;
        this.states = states;
        this.context = context;
    }

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

    update() {
        if (this.states[this.currentState].execute) {
            this.states[this.currentState].execute.call(this.context);
        }
    }
}