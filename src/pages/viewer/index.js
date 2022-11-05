import { ANVILMembraneOrientation } from 'molstar/lib/extensions/anvil/behavior';
import { CellPack } from 'molstar/lib/extensions/cellpack';
import { DnatcoConfalPyramids } from 'molstar/lib/extensions/dnatco';
import { G3DFormat, G3dProvider } from 'molstar/lib/extensions/g3d/format';
import { GeometryExport } from 'molstar/lib/extensions/geo-export';
import { MAQualityAssessment } from 'molstar/lib/extensions/model-archive/quality-assessment/behavior';
import { QualityAssessmentPLDDTPreset, QualityAssessmentQmeanPreset } from 'molstar/lib/extensions/model-archive/quality-assessment/behavior';
import { QualityAssessment } from 'molstar/lib/extensions/model-archive/quality-assessment/prop';
import { ModelExport } from 'molstar/lib/extensions/model-export';
import { Mp4Export } from 'molstar/lib/extensions/mp4-export';
import { PDBeStructureQualityReport } from 'molstar/lib/extensions/pdbe';
import { RCSBAssemblySymmetry, RCSBValidationReport } from 'molstar/lib/extensions/rcsb';
import { ZenodoImport } from 'molstar/lib/extensions/zenodo';
import { PresetStructureRepresentations, StructureRepresentationPresetProvider } from 'molstar/lib/mol-plugin-state/builder/structure/representation-preset';
import { createPluginUI } from './create-plugin-ui';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import { PluginSpec } from 'molstar/lib/mol-plugin/spec';
import { StateObjectRef } from 'molstar/lib/mol-state';
import 'molstar/lib/mol-util/polyfill';
import { ObjectKeys } from 'molstar/lib/mol-util/type-helpers';
import { Backgrounds } from 'molstar/lib/extensions/backgrounds';
import { PLUGIN_VERSION as version } from 'molstar/lib/mol-plugin/version';
import { setDebugMode, setProductionMode } from 'molstar/lib/mol-util/debug';
import { PluginStateObject as PSO, PluginStateTransform } from 'molstar/lib/mol-plugin-state/objects';
import { Task } from 'molstar/lib/mol-task';
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition';
import { StateObject } from 'molstar/lib/mol-state';
import { Structure } from 'molstar/lib/mol-model/structure';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { Color } from 'molstar/lib/mol-util/color';

const CustomFormats = [
  ['g3d', G3dProvider]
];

const Extensions = {
  'backgrounds': PluginSpec.Behavior(Backgrounds),
  'cellpack': PluginSpec.Behavior(CellPack),
  'dnatco-confal-pyramids': PluginSpec.Behavior(DnatcoConfalPyramids),
  'pdbe-structure-quality-report': PluginSpec.Behavior(PDBeStructureQualityReport),
  'rcsb-assembly-symmetry': PluginSpec.Behavior(RCSBAssemblySymmetry),
  'rcsb-validation-report': PluginSpec.Behavior(RCSBValidationReport),
  'anvil-membrane-orientation': PluginSpec.Behavior(ANVILMembraneOrientation),
  'g3d': PluginSpec.Behavior(G3DFormat),
  'model-export': PluginSpec.Behavior(ModelExport),
  'mp4-export': PluginSpec.Behavior(Mp4Export),
  'geo-export': PluginSpec.Behavior(GeometryExport),
  'ma-quality-assessment': PluginSpec.Behavior(MAQualityAssessment),
  'zenodo-import': PluginSpec.Behavior(ZenodoImport),
};

const DefaultViewerOptions = {
  customFormats: CustomFormats,
  extensions: ObjectKeys(Extensions),
  layoutIsExpanded: true,
  layoutShowControls: true,
  layoutShowRemoteState: true,
  layoutControlsDisplay: 'reactive',
  layoutShowSequence: true,
  layoutShowLog: true,
  layoutShowLeftPanel: true,
  collapseLeftPanel: false,
  collapseRightPanel: false,
  disableAntialiasing: PluginConfig.General.DisableAntialiasing.defaultValue,
  pixelScale: PluginConfig.General.PixelScale.defaultValue,
  pickScale: PluginConfig.General.PickScale.defaultValue,
  pickPadding: PluginConfig.General.PickPadding.defaultValue,
  enableWboit: PluginConfig.General.EnableWboit.defaultValue,
  enableDpoit: PluginConfig.General.EnableDpoit.defaultValue,
  preferWebgl1: PluginConfig.General.PreferWebGl1.defaultValue,
  allowMajorPerformanceCaveat: PluginConfig.General.AllowMajorPerformanceCaveat.defaultValue,

  viewportShowExpand: PluginConfig.Viewport.ShowExpand.defaultValue,
  viewportShowControls: PluginConfig.Viewport.ShowControls.defaultValue,
  viewportShowSettings: PluginConfig.Viewport.ShowSettings.defaultValue,
  viewportShowSelectionMode: PluginConfig.Viewport.ShowSelectionMode.defaultValue,
  viewportShowAnimation: PluginConfig.Viewport.ShowAnimation.defaultValue,
  viewportShowTrajectoryControls: PluginConfig.Viewport.ShowTrajectoryControls.defaultValue,

  pluginStateServer: PluginConfig.State.DefaultServer.defaultValue,

  volumeStreamingServer: PluginConfig.VolumeStreaming.DefaultServer.defaultValue,
  volumeStreamingDisabled: !PluginConfig.VolumeStreaming.Enabled.defaultValue,

  pdbProvider: PluginConfig.Download.DefaultPdbProvider.defaultValue,
  emdbProvider: PluginConfig.Download.DefaultEmdbProvider.defaultValue,
  saccharideCompIdMapType: 'default',
};

const ViewerAutoPreset = StructureRepresentationPresetProvider({
  id: 'preset-structure-representation-viewer-auto',
  display: {
    name: 'Automatic (w/ Annotation)', group: 'Annotation',
    description: 'Show standard automatic representation but colored by quality assessment (if available in the model).'
  },
  isApplicable(a) {
    return (
      !!a.data.models.some(m => QualityAssessment.isApplicable(m, 'pLDDT')) ||
      !!a.data.models.some(m => QualityAssessment.isApplicable(m, 'qmean'))
    );
  },
  params: () => StructureRepresentationPresetProvider.CommonParams,
  async apply(ref, params, plugin) {
    const structureCell = StateObjectRef.resolveAndCheck(plugin.state.data, ref);
    const structure = structureCell && structureCell.obj && structureCell.obj.data;
    if (!structureCell || !structure) return {};

    if (structure.models.some(m => QualityAssessment.isApplicable(m, 'pLDDT'))) {
      return await QualityAssessmentPLDDTPreset.apply(ref, params, plugin);
    } else if (structure.models.some(m => QualityAssessment.isApplicable(m, 'qmean'))) {
      return await QualityAssessmentQmeanPreset.apply(ref, params, plugin);
    } else {
      return await PresetStructureRepresentations.auto.apply(ref, params, plugin);
    }
  }
});

const MergeStructures = PluginStateTransform.BuiltIn({
  name: 'merge-structures',
  display: { name: 'Merge Structures', description: 'Merge Structure' },
  from: PSO.Root,
  to: PSO.Molecule.Structure,
  params: {
    structures: PD.ObjectList({
      ref: PD.Text('')
    }, ({ ref }) => ref, { isHidden: true })
  }
})({
  apply({ params, dependencies }) {
    return Task.create('Merge Structures', async ctx => {
      if (params.structures.length === 0) return StateObject.Null;

      const first = dependencies ? dependencies[params.structures[0].ref].data : null;
      const builder = Structure.Builder({ masterModel: first.models[0] });
      for (const { ref } of params.structures) {
        const s = dependencies ? dependencies[ref].data : null;
        for (const unit of s.units) {
          // TODO invariantId
          builder.addUnit(unit.kind, unit.model, unit.conformation.operator, unit.elements, unit.traits);
        }
      }

      const structure = builder.getStructure();
      return new PSO.Molecule.Structure(structure, { label: 'Merged Structure' });
    });
  }
});

const Canvas3DPresets = {
  illustrative: {
    canvas3d: {
      postprocessing: {
        occlusion: { name: 'on', params: { samples: 32, radius: 6, bias: 1.4, blurKernelSize: 15, resolutionScale: 1 } },
        outline: { name: 'on', params: { scale: 1, threshold: 0.33, color: Color(0x000000) } }
      },
      renderer: {
        ambientIntensity: 1.0,
        light: []
      }
    }
  },
  occlusion: {
    canvas3d: {
      postprocessing: {
        occlusion: { name: 'on', params: { samples: 32, radius: 6, bias: 1.4, blurKernelSize: 15, resolutionScale: 1 } },
        outline: { name: 'off', params: {} }
      },
      renderer: {
        ambientIntensity: 0.4,
        light: [{ inclination: 180, azimuth: 0, color: Color.fromNormalizedRgb(1.0, 1.0, 1.0),
          intensity: 0.6 }]
      }
    }
  },
  standard: {
    canvas3d: {
      postprocessing: {
        occlusion: { name: 'off', params: {} },
        outline: { name: 'off', params: {} }
      },
      renderer: {
        ambientIntensity: 0.4,
        light: [{ inclination: 180, azimuth: 0, color: Color.fromNormalizedRgb(1.0, 1.0, 1.0),
          intensity: 0.6 }]
      }
    }
  }
};

class Viewer {

  constructor(plugin) {
    this.plugin = plugin;
  }

  static async create(elementOrId, os ={}) {
    const element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!element) throw new Error(`Could not get element with id '${elementOrId}'`);

    const definedOptions = {};
    // filter for defined properies only so the default values
    // are property applied
    for (const p of Object.keys(os)) {
      if (os[p] !== void 0) definedOptions[p] = os[p];
    }

    const options = { ...DefaultViewerOptions, ...definedOptions };
    const defaultSpec = DefaultPluginUISpec();

    const spec = {
      actions: defaultSpec.actions,
      behaviors: [
        ...defaultSpec.behaviors,
        ...options.extensions.map(e => Extensions[e]),
      ],
      animations: [ ...(defaultSpec.animations || []) ],
      customParamEditors: defaultSpec.customParamEditors,
      customFormats: options ? options.customFormats : {},
      layout: {
        initial: {
          isExpanded: options.layoutIsExpanded,
          showControls: options.layoutShowControls,
          controlsDisplay: options.layoutControlsDisplay,
          regionState: {
            bottom: 'full',
            left: options.collapseLeftPanel ? 'collapsed' : 'full',
            right: options.collapseRightPanel ? 'hidden' : 'full',
            top: 'full',
          }
        },
      },
      components: {
        ...defaultSpec.components,
        controls: {
          ...(defaultSpec.components ? defaultSpec.components.controls : {}),
          top: options.layoutShowSequence ? undefined : 'none',
          bottom: options.layoutShowLog ? undefined : 'none',
          left: options.layoutShowLeftPanel ? undefined : 'none',
        },
        remoteState: options.layoutShowRemoteState ? 'default' : 'none',
      },
      config: [
        [PluginConfig.General.DisableAntialiasing, options.disableAntialiasing],
        [PluginConfig.General.PixelScale, options.pixelScale],
        [PluginConfig.General.PickScale, options.pickScale],
        [PluginConfig.General.PickPadding, options.pickPadding],
        [PluginConfig.General.EnableWboit, options.enableWboit],
        [PluginConfig.General.EnableDpoit, options.enableDpoit],
        [PluginConfig.General.PreferWebGl1, options.preferWebgl1],
        [PluginConfig.General.AllowMajorPerformanceCaveat, options.allowMajorPerformanceCaveat],
        [PluginConfig.Viewport.ShowExpand, options.viewportShowExpand],
        [PluginConfig.Viewport.ShowControls, options.viewportShowControls],
        [PluginConfig.Viewport.ShowSettings, options.viewportShowSettings],
        [PluginConfig.Viewport.ShowSelectionMode, options.viewportShowSelectionMode],
        [PluginConfig.Viewport.ShowAnimation, options.viewportShowAnimation],
        [PluginConfig.Viewport.ShowTrajectoryControls, options.viewportShowTrajectoryControls],
        [PluginConfig.State.DefaultServer, options.pluginStateServer],
        [PluginConfig.State.CurrentServer, options.pluginStateServer],
        [PluginConfig.VolumeStreaming.DefaultServer, options.volumeStreamingServer],
        [PluginConfig.VolumeStreaming.Enabled, !options.volumeStreamingDisabled],
        [PluginConfig.Download.DefaultPdbProvider, options.pdbProvider],
        [PluginConfig.Download.DefaultEmdbProvider, options.emdbProvider],
        [PluginConfig.Structure.DefaultRepresentationPreset, ViewerAutoPreset.id],
        [PluginConfig.Structure.SaccharideCompIdMapType, options.saccharideCompIdMapType],
      ]
    };

    const plugin = await createPluginUI(element, spec, {
      onBeforeUIRender: plugin => {
        // the preset needs to be added before the UI renders otherwise
        // "Download Structure" wont be able to pick it up
        plugin.builders.structure.representation.registerPreset(ViewerAutoPreset);
      },
    });
    return new Viewer(plugin);
  }

  static loadStructuresFromUrlsAndMerge = async (sources, plugin) => {
    // clear state
    // plugin && plugin.clear();
    await plugin && plugin.clear();

    // if (!Array.isArray(sources) || sources.length === 0) return;
    if (!plugin) return;
    let structures = [];
    for (let i = 0; i < sources.length; i++) {
      const file = sources[i];
      const { url } = file;
      let format = url.split('.').pop().replace('cif', 'mmcif');
      if (format.includes('?')) {
        format = format.substring(0, format.indexOf('?'));
      }
      const data = await plugin.builders.data.download({ url, isBinary: false });
      const trajectory = await plugin.builders.structure.parseTrajectory(data, format);
      const model = await plugin.builders.structure.createModel(trajectory);
      const modelProperties = await plugin.builders.structure.insertModelProperties(model);
      
      const structure = await plugin.builders.structure.createStructure(model || modelProperties, { name: 'model', params: {} });
      
      const polymer = await plugin.builders.structure.tryCreateComponentStatic(structure, 'polymer');
      if (polymer) await plugin.builders.structure.representation.addRepresentation(polymer, { type: 'spacefill', color: 'illustrative' });

      const ligand = await plugin.builders.structure.tryCreateComponentStatic(structure, 'ligand');
      if (ligand) await plugin.builders.structure.representation.addRepresentation(ligand, { type: 'ball-and-stick', color: 'element-symbol', colorParams: { carbonColor: { name: 'element-symbol', params: {} } } });
    }

    const props = Canvas3DPresets['illustrative'];
    if (props.canvas3d.postprocessing.occlusion && props.canvas3d.postprocessing.occlusion.name === 'on') {
      props.canvas3d.postprocessing.occlusion.params.radius = 5;
      props.canvas3d.postprocessing.occlusion.params.bias = 1.1;
    }
    PluginCommands.Canvas3D.SetSettings(plugin, {
      settings: {
        ...props,
        renderer: {
          ...(plugin.canvas3d ? plugin.canvas3d.props.renderer : {}),
          ...props.canvas3d.renderer
        },
        postprocessing: {
          ...(plugin.canvas3d ? plugin.canvas3d.props.postprocessing : {}),
          ...props.canvas3d.postprocessing
        },
      }
    });
  }

}

export { Viewer, version, setDebugMode, setProductionMode };
