import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';

class TaskList {

  static execute() {
    let wrapper = document.querySelector('#plugin-wrapper');
    ReactDOM.render(<App showPlugin={true} />, wrapper);
  }

}

export default TaskList;

window.app.registerPluginItemCallback('protein', TaskList.execute);
