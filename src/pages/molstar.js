import React, { createRef } from 'react';
import PropTypes from 'prop-types';
import shallowEqual from 'shallowequal';
import { ParamDefinition } from 'molstar/lib/mol-util/param-definition';
import { CameraHelperParams } from 'molstar/lib/mol-canvas3d/helper/camera-helper';
import { Viewer } from './viewer';

import 'molstar/build/viewer/molstar.css';

class Molstar extends React.Component {

  constructor(props) {
    super(props);
    this.parentRef = createRef();
    this.plugin = null;
  }

  componentDidMount() {
    const { files } = this.props;
    Viewer.create(this.parentRef.current, {}).then(res => {
      this.plugin = res.plugin;
      window.molstarPlugin = this.plugin;
      Viewer.loadStructuresFromUrlsAndMerge(files, this.plugin);
      if (this.plugin && this.plugin.canvas3d) {
        this.plugin.canvas3d.setProps({ camera: { helper: {
          axes: ParamDefinition.getDefaultValues(CameraHelperParams).axes
        } } });
      }
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { files } = nextProps;
    if (!shallowEqual({ files }, { files: this.props.files})) {
      Viewer.loadStructuresFromUrlsAndMerge(files, this.plugin);
      if (this.plugin && this.plugin.canvas3d) {
        this.plugin.canvas3d.setProps({ camera: { helper: {
          axes: ParamDefinition.getDefaultValues(CameraHelperParams).axes
        } } });
      }
    }
  }

  componentWillUnmount() {
    this.plugin && this.plugin.clear && this.plugin.clear();
  }

  render() {
    const { className } = this.props;
    return (
      <div className={`${className ? className + ' ' : ''}position-relative w-100 h-100 o-hidden`} ref={this.parentRef}>
      </div>
    );
  }

}

Molstar.propTypes = {
  files: PropTypes.array,
  className: PropTypes.string,
};

export default Molstar;
