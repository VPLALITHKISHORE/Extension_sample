import axios from 'axios';
import * as vscode from 'vscode';
import { WEBSTATUS_API_URL, CACHE_DURATION, STATUS_ICONS } from './utils/constants';

export interface BaselineStatus {
  status: 'newly' | 'widely' | 'limited';
  low_date?: string;
}

export interface BrowserImplementation {
  date: string;
  status: 'available' | 'unavailable';
  version: string;
}

export interface WebFeature {
  baseline?: BaselineStatus;
  browser_implementations: {
    [browser: string]: BrowserImplementation;
  };
  feature_id: string;
  name: string;
  spec: {
    links: Array<{ link: string }>;
  };
  usage?: {
    [browser: string]: {
      daily?: number;
    };
  };
}

interface WebStatusResponse {
  data: WebFeature[];
}

export class WebStatusApiClient {
  private static instance: WebStatusApiClient;
  private cache = new Map<string, WebFeature>();
  private lastFetch: number = 0;
  private outputChannel: vscode.OutputChannel | undefined;

  static getInstance(): WebStatusApiClient {
    if (!WebStatusApiClient.instance) {
      WebStatusApiClient.instance = new WebStatusApiClient();
    }
    return WebStatusApiClient.instance;
  }

  setOutputChannel(channel: vscode.OutputChannel) {
    this.outputChannel = channel;
  }

  async fetchFeatures(): Promise<WebFeature[]> {
    const now = Date.now();
    
    if (now - this.lastFetch < CACHE_DURATION && this.cache.size > 0) {
      this.outputChannel?.appendLine('📋 Using cached WebStatus data');
      return Array.from(this.cache.values());
    }

    try {
      this.outputChannel?.appendLine('🌐 Fetching WebStatus features...');
      
      const response = await axios.get<WebStatusResponse>(WEBSTATUS_API_URL, {
        timeout: 10000,
        headers: {
          'User-Agent': 'BaselineGuard-VSCode-Extension/1.0.0'
        }
      });
      
      // Update cache
      this.cache.clear();
      response.data.data.forEach(feature => {
        this.cache.set(feature.feature_id, feature);
      });
      
      this.lastFetch = now;
      this.outputChannel?.appendLine(`✅ Loaded ${response.data.data.length} features from WebStatus API`);
      return response.data.data;
      
    } catch (error) {
      this.outputChannel?.appendLine(`❌ Failed to fetch WebStatus data: ${error}`);
      // Return cached data if available
      return Array.from(this.cache.values());
    }
  }

  getFeature(featureId: string): WebFeature | undefined {
    return this.cache.get(featureId);
  }

  searchFeaturesByName(name: string): WebFeature[] {
    const searchTerm = name.toLowerCase();
    return Array.from(this.cache.values()).filter(feature => 
      feature.name.toLowerCase().includes(searchTerm) ||
      feature.feature_id.toLowerCase().includes(searchTerm)
    );
  }

  getBaselineStatus(feature: WebFeature) {
    if (!feature.baseline) {
      return {
        status: 'unknown',
        statusText: 'Unknown availability',
        color: '#666666',
        icon: STATUS_ICONS.unknown
      };
    }

    switch (feature.baseline.status) {
      case 'widely':
        return {
          status: 'widely',
          statusText: 'Widely available',
          color: '#4caf50',
          icon: STATUS_ICONS.widely
        };
      case 'newly':
        return {
          status: 'newly', 
          statusText: 'Newly available',
          color: '#ff9800',
          icon: STATUS_ICONS.newly
        };
      case 'limited':
        return {
          status: 'limited',
          statusText: 'Limited availability', 
          color: '#f44336',
          icon: STATUS_ICONS.limited
        };
      default:
        return {
          status: 'unknown',
          statusText: 'Unknown availability',
          color: '#666666',
          icon: STATUS_ICONS.unknown
        };
    }
  }

  getBrowserSupportSummary(feature: WebFeature): string {
    const implementations = feature.browser_implementations;
    const supported = Object.entries(implementations).filter(([_, impl]) => impl.status === 'available');
    const total = Object.keys(implementations).length;
    
    return `${supported.length}/${total} browsers supported`;
  }

  forceRefresh() {
    this.cache.clear();
    this.lastFetch = 0;
    this.outputChannel?.appendLine('🗑️ Cache cleared, forcing refresh on next fetch');
  }

  getCacheInfo() {
    return {
      size: this.cache.size,
      lastFetch: this.lastFetch,
      isStale: Date.now() - this.lastFetch > CACHE_DURATION
    };
  } 
}