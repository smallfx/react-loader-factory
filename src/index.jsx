import React from 'react';
import { connect } from 'react-redux';
import equal from 'deep-equal';

function deepIncludes(arr, item) {
  return arr.some(el => equal(el, item));
}

function shallowDesymbolize(obj) {
  if (obj instanceof Array) {
    return obj.map((el) => shallowDesymbolize(el));
  } else if (obj instanceof Object) {
    const res = {};
    Object.getOwnPropertySymbols(obj).forEach((key) => {
      const desymbolizedKey = ('__dsym__').concat(String(key));
      res[desymbolizedKey] = obj[key];
    });
    return res;
  }
  return obj;
}

export default function loaderFactory(actionsList, requestStates, stateInjector) {

  return function(WrappedComponent) {

    const factoryInjector = stateInjector || function(state) {
      return { activeRequests: state.get('activeRequests').toJS() };
    };

    class Loader extends React.Component {
      constructor(props) {
        super(props);

        this.currentRequests = [];
        this.needsDispatch = true;
      }

      render() {
        const { activeRequests, dispatch } = this.props;
        // call actions, but throttle if repeating
        actionsList.forEach(action => {
          if (!deepIncludes(shallowDesymbolize(this.currentRequests),
                            shallowDesymbolize(action))) {
            this.currentRequests.push(action);
            dispatch(action);
            justDispatched = false;
          }
        });

        // monitor given request states
        const requestsBusy = (!this.needsDispatch) ? true : (() => {
          if (activeRequests instanceof Array) {
            return requestStates
                    .some(state => activeRequests.includes(state));
          } else if (activeRequests instanceof Object) { // works as else if
            return requestStates
                    .some(state => Object.keys(activeRequests).includes(state));
          } else {
            console.warn(
              'Loader: did not receive a valid requestStates object: ',
              requestStates
            );
            return false;
          }
        })();

        // return function that takes a component which will be rendered when
        // none of the request states is active
        const Throbber = (this.props.throbber || function(props) {
          return (
            <div
              className={ props.throbberClass || "loader layout--flex" }
            >
              <h1>Loading...</h1>
            </div>
          );
        });

        // in other words:
        // IF requesting RENDER throbber
        // ELSE render given component
        if (requestsBusy) {
          return (<Throbber />);
        } else {
          return (
            <WrappedComponent { ...this.props } />
          );
        }
      }
    }

    return connect(factoryInjector)(Loader);
  };
}
