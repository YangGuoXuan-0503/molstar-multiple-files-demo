import React from 'react';
import PropTypes from 'prop-types';
import Molstar from './molstar';

import './index.css';

function Main(props) {
  const { files } = props;
  return (
    <div className="seatable-plugin-protein-main w-100 o-hidden">
      <Molstar className="seatable-plugin-protein-molstar" files={files} />
    </div>
  );
}

Main.propTypes = {
  files: PropTypes.array,
};

export default Main;
