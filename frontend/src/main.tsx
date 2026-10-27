// The extension script the chat page imports before it starts: register
// every React view here, and link to it from backend/app/ui/index.html.
import './index.css';

import { lovia } from '@/lib/lovia';
import { reactView } from '@/lib/view';
import { Dashboard } from '@/views/dashboard/Dashboard';

lovia.registerView('dashboard', reactView(lovia.t('app.dashboard'), Dashboard));
