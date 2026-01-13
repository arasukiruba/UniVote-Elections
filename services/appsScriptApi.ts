import { Role, ElectionStatus, User, Election, Position, Candidate, WhitelistEntry } from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================
const API_URL =
  'https://script.google.com/macros/s/AKfycbzwBsPv5Wjw_4oUni6tkTwZF9_gGoyMaKgbWRFnTUchDK8g7YPlmmM0K9g3-ZMS0vE_iA/exec';

// ============================================================================
// CACHE & PERFORMANCE UTILS
// ============================================================================

interface CacheItem {
  timestamp: number;
  data: any;
  ttl: number;
}

class RequestCache {
  private cache: Map<string, CacheItem> = new Map();
  private inflight: Map<string, Promise<any>> = new Map();

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set(key: string, data: any, ttlSeconds: number) {
    this.cache.set(key, {
      timestamp: Date.now(),
      data,
      ttl: ttlSeconds * 1000,
    });
  }

  invalidate(prefix: string) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }

  async fetchDeduped(key: string, fetchFn: () => Promise<any>): Promise<any> {
    if (this.inflight.has(key)) return this.inflight.get(key);

    const promise = fetchFn().finally(() => this.inflight.delete(key));
    this.inflight.set(key, promise);
    return promise;
  }
}

const apiCache = new RequestCache();

// Helper to limit concurrency
const pLimit = <T>(items: T[], limit: number, fn: (item: T) => Promise<any>): Promise<any[]> => {
  let index = 0;
  const results: any[] = [];

  const exec = async (): Promise<void> => {
    while (index < items.length) {
      const i = index++;
      try {
        results[i] = await fn(items[i]);
      } catch (e) {
        results[i] = { error: e };
      }
    }
  };

  const workers = Array(Math.min(limit, items.length)).fill(null).map(exec);
  return Promise.all(workers).then(() => results);
};

// ============================================================================
// HELPERS
// ============================================================================

const fixDriveUrl = (url: string | undefined): string => {
  if (!url) return 'https://via.placeholder.com/150?text=No+Image';

  // If not a google url, return as is
  if (!url.includes('google.com')) return url;

  // Extract ID
  let id = '';
  const match1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const match2 = url.match(/id=([a-zA-Z0-9_-]+)/);

  if (match1) id = match1[1];
  else if (match2) id = match2[1];

  if (id) {
    // Reliable image preview endpoint
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
  }

  return url;
};

const processCandidate = (c: Candidate): Candidate => ({
  ...c,
  imageUrl: fixDriveUrl(c.imageUrl),
});

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]); // ✅ remove prefix
    reader.onerror = reject;
  });
};

// ============================================================================
// API IMPLEMENTATION
// ============================================================================

const callApi = async (action: string, payload: any = {}, ttlSeconds = 0) => {
  const cacheKey = `${action}:${JSON.stringify(payload)}`;

  // 1. Cache
  if (ttlSeconds > 0) {
    const cached = apiCache.get(cacheKey);
    if (cached) {
      console.log(`[Cache Hit] ${action}`);
      return cached;
    }
  }

  // 2. Fetch with Deduplication
  return apiCache.fetchDeduped(cacheKey, async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // ✅ FIXED
        body: JSON.stringify({ action, payload }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      if (!json.success) throw new Error(json.message);

      // 3. Set Cache
      if (ttlSeconds > 0) apiCache.set(cacheKey, json.data, ttlSeconds);

      return json.data;
    } catch (error) {
      console.error(`API Error [${action}]:`, error);
      throw error;
    }
  });
};

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User | null> => {
      return callApi('login', { email, password }, 300);
    },
    registerVoter: async (email: string, password: string) => {
      apiCache.invalidate('getWhitelist');
      return callApi('registerVoter', { email, password });
    },
  },

  master: {
    getAdmins: async () => callApi('getAdmins', {}, 30),
    createAdmin: async (name: string, email: string, password?: string) => {
      apiCache.invalidate('getAdmins');
      return callApi('createAdmin', { name, email, password });
    },
    toggleStatus: async (id: string) => {
      apiCache.invalidate('getAdmins');
      return callApi('toggleStatus', { id });
    },
    deleteAdmin: async (id: string) => {
      apiCache.invalidate('getAdmins');
      return callApi('deleteAdmin', { id });
    },
    getLogs: async () => [],
  },

  admin: {
    getElections: async (adminId?: string) => {
      const res = await callApi('getElections', { adminId }, 5);
      return Array.isArray(res) ? res : [];
    },

    getElectionBundle: async (id: string) => {
      const data = await callApi('getElectionBundle', { electionId: id }, 10);
      if (data && data.candidates) {
        data.candidates = data.candidates.map(processCandidate);
      }
      return data;
    },

    getElection: async (id: string) => {
      const all = await api.admin.getElections();
      return all.find((e: Election) => e.id === id);
    },

    createElection: async (title: string, pollingDate: string, createdBy: string) => {
      apiCache.invalidate('getElections');
      return callApi('createElection', { title, pollingDate, createdBy });
    },
    deleteElection: async (id: string) => {
      apiCache.invalidate('getElections');
      return callApi('deleteElection', { id });
    },
    updateElectionStatus: async (id: string, status: ElectionStatus) => {
      apiCache.invalidate('getElections');
      apiCache.invalidate(`getElectionBundle:{"electionId":"${id}"}`);
      return callApi('updateElectionStatus', { id, status });
    },
    updateElectionDate: async (id: string, date: string) => {
      apiCache.invalidate('getElections');
      apiCache.invalidate(`getElectionBundle:{"electionId":"${id}"}`);
      return callApi('updateElectionDate', { id, date });
    },
    resetVotes: async (electionId: string) => {
      apiCache.invalidate('getResults');
      apiCache.invalidate('getStats');
      apiCache.invalidate('getVoterElectionBundle');
      apiCache.invalidate('getWhitelist');
      return callApi('resetVotes', { electionId });
    },

    // Positions
    getPositions: async (electionId: string) => callApi('getPositions', { electionId }, 30),
    addPosition: async (electionId: string, title: string) => {
      apiCache.invalidate(`getElectionBundle:{"electionId":"${electionId}"}`);
      apiCache.invalidate('getPositions');
      return callApi('addPosition', { electionId, title, orderIndex: 0 });
    },
    deletePosition: async (id: string) => {
      apiCache.invalidate('getElectionBundle');
      apiCache.invalidate('getPositions');
      return callApi('deletePosition', { id });
    },

    // Candidates
    getCandidates: async (electionId: string) => {
      const res = await callApi('getCandidates', { electionId }, 30);
      return Array.isArray(res) ? res.map(processCandidate) : [];
    },
    addCandidate: async (candidate: Omit<Candidate, 'id'>) => {
      apiCache.invalidate(`getElectionBundle:{"electionId":"${candidate.electionId}"}`);
      apiCache.invalidate('getCandidates');
      return callApi('addCandidate', candidate);
    },
    updateCandidate: async (candidate: Candidate) => {
      apiCache.invalidate(`getElectionBundle:{"electionId":"${candidate.electionId}"}`);
      apiCache.invalidate('getCandidates');
      return callApi('updateCandidate', candidate);
    },
    deleteCandidate: async (id: string) => {
      apiCache.invalidate('getElectionBundle');
      apiCache.invalidate('getCandidates');
      return callApi('deleteCandidate', { id });
    },

    // ✅ FIXED UPLOADS
    uploadFile: async (file: File, category: 'profile' | 'campaign') => {
      const base64 = await fileToBase64(file);

      // Apps Script returns a STRING URL directly (not {url:...})
      const res = await callApi('uploadFile', {
        base64,
        fileName: file.name,
        mimeType: file.type,
        category,
      });

      // ✅ if profile image -> fix URL for display
      // ✅ if campaign document -> return raw URL for download
      return category === 'profile' ? fixDriveUrl(res) : res;
    },

    uploadBatch: async (files: File[], category: 'campaign', onProgress?: (completed: number) => void) => {
      let completed = 0;

      return pLimit(files, 3, async (file) => {
        const url = await api.admin.uploadFile(file, category);
        completed++;
        if (onProgress) onProgress(completed);

        return {
          id: Date.now() + Math.random().toString(),
          name: file.name,
          type: file.type,
          url,
        };
      });
    },

    // Whitelist
    getWhitelist: async (electionId: string) => callApi('getWhitelist', { electionId }, 30),
    addToWhitelist: async (electionId: string, email: string) => {
      apiCache.invalidate('getWhitelist');
      return callApi('addToWhitelist', { electionId, email });
    },
    addBatchToWhitelist: async (electionId: string, emails: string[], onProgress?: (completed: number) => void) => {
      apiCache.invalidate('getWhitelist');
      let completed = 0;
      return pLimit(emails, 3, async (email) => {
        try {
          await callApi('addToWhitelist', { electionId, email });
        } catch (e) {
          console.error(`Failed to whitelist ${email}:`, e);
        }
        completed++;
        if (onProgress) onProgress(completed);
        return email;
      });
    },
    removeFromWhitelist: async (id: string) => {
      apiCache.invalidate('getWhitelist');
      return callApi('removeFromWhitelist', { id });
    },
  },

  voter: {
    getAuthorizedElections: async (email: string) => callApi('getAuthorizedElections', { email }, 30),

    getVoterElectionBundle: async (electionId: string, email: string) => {
      const data = await callApi('getVoterElectionBundle', { electionId, email }, 10);
      if (data && data.candidates) {
        data.candidates = data.candidates.map(processCandidate);
      }
      return data;
    },

    vote: async (electionId: string, email: string, selections: Record<string, string>) => {
      const res = await callApi('vote', { electionId, voterEmail: email, selections });
      apiCache.invalidate('getStats');
      apiCache.invalidate('getResults');
      apiCache.invalidate('getVoterElectionBundle');
      return res;
    },
    hasVoted: async (electionId: string, email: string) => {
      return callApi('hasVoted', { electionId, email }, 60);
    },
  },

  results: {
    getResults: async (electionId: string) => {
      const res = await callApi('getResults', { electionId }, 15);
      return Array.isArray(res) ? res.map(processCandidate) : [];
    },
    getStats: async (electionId: string) => callApi('getStats', { electionId }, 15),
  },
};
