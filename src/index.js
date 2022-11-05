import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';

class TaskList {

  static execute() {
    ReactDOM.render(
      <App showPlugin={true} isDevelopment={true}/>,
      document.getElementById('root')
    );
  }

}

TaskList.execute();
