# react-loader-factory

A factory for producing Redux-driven loading screens

## Example

Say you have an asynchronous request that provides data through Redux to a pure
functional component. You'd like to display a loader while waiting for the
request, but you don't want to pollute your beautiful pure function.

With react-loader-factory, you can do this instead:

```js
import React from 'react';
import { myAsyncAction } from '../actions';
import loaderFactory from 'react-loader-factory';
import ChildComponent from './ChildComponent';

const actionsList = [myAsyncAction()];
const monitoredStates = ['ASYNC_REQUEST'];
const loaderWrapper = loaderFactory(actionsList, monitoredStates);

const LoadingChild = loaderWrapper(ChildComponent);

const containingComponent = props => {
  // Do whatever you need to do with your usual containing component

  const childProps = { someProps: 'props' };

  return <LoadingChild { ...childProps } />;
}
```

You'll also need a reducer that tracks which requests are active. Something like
this:

```js
export function activeRequests(state = [], action) {
  const newState = state.slice();

  // regex that tests for an API action string ending with _REQUEST
  const reqReg = new RegExp(/^[A-Z]+\_REQUEST$/g);
  // regex that tests for a API action string ending with _SUCCESS
  const sucReg = new RegExp(/^[A-Z]+\_SUCCESS$/g);

  // if a _REQUEST comes in, add it to the activeRequests list
  if (reqReg.test(action.type)) {
    newState.push(action.type);
  }

  // if a _SUCCESS comes in, delete its corresponding _REQUEST
  if (sucReg.test(action.type)) {
    const reqType = action.type.split('_')[0].concat('_REQUEST');
    const deleteInd = state.indexOf(reqType);

    if (deleteInd !== -1) {
      newState.splice(deleteInd, 1);
    }
  }

  return newState;
}
```

As long as none of the requests specified in `monitoredStates` have come back
with a `SUCCESS` (or whatever you use to specify a successful request), the
loader will continue to display its default throbber, or a `throbber` prop you
pass into the returned loading component.

## The guts

1. `loaderFactory(actionsList, monitoredStates)` returns a higher-order
   component that connects to the Redux store and monitors the `activeRequests`
   state branch for values it's been told to monitor. It expects
   `activeRequests` to have a `.some()` method to test with. It also takes
   responsibility for dispatching the Redux actions specified in `actionsList`
   exactly once.

2. If any of its monitored active requests are present, it displays
   `this.props.throbber` or a default `<div>` with a class
   `this.props.throbberClass` (or `loader layout--flex` if none is specified).

3. If there are no more active requests the wrapped component cares about, the
   throbber component gets out of the way and returns the originally wrapped
   component, with all props passed through.

### Why a factory?

The factory pattern is needed to set up the `connect()` call that hooks the
component up to your Redux store. There's no way for a component to dynamically
`connect()` itself when evaluated, so the factory pattern gives you that
convenience.

## Things like this

- [react-loader](https://github.com/TheCognizantFoundry/react-loader): Stateful
  single component version without any particular connection to Redux.
- [React Higher Order Components in depth](https://medium.com/@franleplant/react-higher-order-components-in-depth-cf9032ee6c3e#.nwgftq1ft):
  My reference for HOCs.
