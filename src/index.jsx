import React from 'react';
import { connect } from 'react-redux';
import equal from 'deep-equal';

function deepIncludes(arr, item) {
  return arr.some(el => equal(el, item));
}

export default function loaderFactory(actionsList, requestStates) {

  return function(WrappedComponent) {

    function factoryInjector(state) {
      return { activeRequests: state.get('activeRequests').toJS() };
    }

    class Loader extends React.Component {
      constructor(props) {
        super(props);

        this.currentRequests = [];
      }
      
      render() {
        const { activeRequests, dispatch } = this.props;
        // call actions, but throttle if repeating
        actionsList.forEach(action => {
          if (!deepIncludes(this.currentRequests,action)) {
            this.currentRequests.push(action);
            dispatch(action);
          }
        });

        // monitor given request states
        const requestsBusy = requestStates
                .some(state => activeRequests.includes(state));
        
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
            <WrappedComponent {...this.props} />
          );
        }
      }
    }
    
    return connect(factoryInjector)(Loader);
  };
}
