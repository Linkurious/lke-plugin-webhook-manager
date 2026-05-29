import {PluginConfig, PluginRouteOptions as PluginRouteOptionsBase} from '@linkurious/rest-client';

export interface PluginRouteOptions extends PluginRouteOptionsBase<PluginConfig> {
  parentProcess?: PluginParentProcess;
}

export interface PluginParentProcess {
  postMetadata(metadata: PluginMetadata): void;
}

export interface PluginMetadata {
  actions: PluginAction[];
}

export interface PluginAction {
  name: string;
  urlTemplate: string;
  sourceKey?: string;
  access: 'admin' | '*';
}
