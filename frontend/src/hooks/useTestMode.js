import { useState, useEffect } from 'react';
import api from '../services/api';

let cachedTestMode = null;

export default function useTestMode() {
  const [testMode, setTestMode] = useState(cachedTestMode ?? false);

  useEffect(() => {
    if (cachedTestMode !== null) return;
    api.get('/config').then(res => {
      cachedTestMode = res.data.testMode;
      setTestMode(cachedTestMode);
    }).catch(() => {});
  }, []);

  const unit = testMode ? 'min' : 'days';
  const unitFull = testMode ? 'minutes' : 'days';

  return { testMode, unit, unitFull };
}
