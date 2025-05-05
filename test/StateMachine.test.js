import { StateMachine } from '../src/gameObjects/state-machine/stateMachine.js';

describe('StateMachine', () => {
    // Test variables declaration
    let stateMachine;
    let mockStates;
    let mockContext;
    
    beforeEach(() => {
        // Im creating a fresh set of mocks before each test
        mockContext = {
            setVelocityX: jest.fn(),
            anims: { 
                play: jest.fn() 
            },
            flipX: false
        };
        
        // These mock states represent are character's possible actions
        // Each with enter, execute and exit methods that Jest can track
        mockStates = {
            IDLE: {
                enter: jest.fn(),
                execute: jest.fn(),
                exit: jest.fn()
            },
            RUNNING: {
                enter: jest.fn(),
                execute: jest.fn(),
                exit: jest.fn()
            },
            JUMPING: {
                enter: jest.fn(),
                execute: jest.fn(),
                exit: jest.fn()
            },
            ATTACKING: {
                enter: jest.fn(),
                execute: jest.fn(),
                exit: jest.fn()
            }
        };
        
        // Initialize state machine with IDLE as the starting state
        stateMachine = new StateMachine('IDLE', mockStates, mockContext);
    });
    
    test('should initialize with the correct initial state', () => {
        // Just making sure the state machine starts in right state
        expect(stateMachine.currentState).toBe('IDLE');
        expect(stateMachine.isTransitioning).toBe(false);
        expect(stateMachine.queuedTransition).toBeNull();
    });
    
    test('should transition between states correctly', () => {
        // When we transition from IDLE to RUNNING
        stateMachine.transition('RUNNING');
        
        // Then the exit method of IDLE should be call
        expect(mockStates.IDLE.exit).toHaveBeenCalled();
        
        // And the enter method of RUNNING should be called
        expect(mockStates.RUNNING.enter).toHaveBeenCalled();
        
        // And the current state should be updated
        expect(stateMachine.currentState).toBe('RUNNING');
    });
    
    test('should execute the current state', () => {
        // When update is called
        stateMachine.update();
        
        // Then the execute method of current state should be called
        expect(mockStates.IDLE.execute).toHaveBeenCalled();
    });
    
    test('should not transition to the same state', () => {
        // When we try to transtion to the same state
        stateMachine.transition('IDLE');
        
        // Then no state methods should be called
        expect(mockStates.IDLE.exit).not.toHaveBeenCalled();
        expect(mockStates.IDLE.enter).not.toHaveBeenCalled();
    });
    
    test('should queue transitions during an ongoing transition', () => {
        // Set the machine to be in a transitioning state
        stateMachine.isTransitioning = true;
        
        // When we request transition while already transitioning
        stateMachine.transition('RUNNING');
        
        // Then the transition should be queed
        expect(stateMachine.queuedTransition).toBe('RUNNING');
        
        // And the state should not have changed yet
        expect(stateMachine.currentState).toBe('IDLE');
    });
    
    test('should process queued transitions after completing the current one', () => {
        // Given a state machine that just finishd a transition
        stateMachine.isTransitioning = true;
        stateMachine.queuedTransition = 'JUMPING';
        
        // When the transition completes (manualy calling the code that runs after transition)
        stateMachine.isTransitioning = false;
        if (stateMachine.queuedTransition) {
            const nextState = stateMachine.queuedTransition;
            stateMachine.queuedTransition = null;
            stateMachine.transition(nextState);
        }
        
        // Then the queued transition should be processed
        expect(stateMachine.currentState).toBe('JUMPING');
        expect(mockStates.IDLE.exit).toHaveBeenCalled();
        expect(mockStates.JUMPING.enter).toHaveBeenCalled();
        expect(stateMachine.queuedTransition).toBeNull();
    });
    
    test('should not transition to a non-existent state', () => {
        // When we try to transition to a state that doesnt exist
        stateMachine.transition('NON_EXISTENT');
        
        // Then the state should not change
        expect(stateMachine.currentState).toBe('IDLE');
        expect(mockStates.IDLE.exit).not.toHaveBeenCalled();
    });
    
    test('should call methods on the correct context', () => {
        // When a states method is called
        stateMachine.transition('RUNNING');
        
        // Then it should be called with context as 'this'
        expect(mockStates.RUNNING.enter.mock.instances[0]).toBe(mockContext);
    });
});