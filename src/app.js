import React from 'react';
import PropTypes from 'prop-types';
import Main from './pages';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      showPlugin: props.showPlugin || false,
    };
  }

  getFiles = () => {
    return [];
  }

  render() {
    const files = this.getFiles();
    
    return (
      <div className="position-fixed h-100 w-100">
        <Main files={files} />
      </div>
    );
  }
}

App.propTypes = {
  showPlugin: PropTypes.bool,
};

export default App;
