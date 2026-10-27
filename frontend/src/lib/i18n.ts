// The React views' own strings, in the language the chat page shows
// (Settings → Language). Strings the template needs live in app.py's MESSAGES.
import { useLoviaState } from '@/lib/lovia';

const en = {
  'dashboard.subtitle': 'Runs over the last 7 days',
  'dashboard.newChat': 'New chat',
  'dashboard.runs': 'Runs',
  'dashboard.successRate': 'Success rate',
  'dashboard.avgDuration': 'Avg. duration',
  'dashboard.tokens': 'Tokens',
  'dashboard.perDay': 'Runs per day',
  'dashboard.live': 'Running now',
  'dashboard.noLive': 'Nothing is running.',
  'dashboard.recent': 'Recent runs',
  'dashboard.noRuns': 'No runs yet — start a chat and it shows up here.',
  'dashboard.loadFailed': 'Could not load runs: {message}',
  'col.started': 'Started',
  'col.chat': 'Chat',
  'col.source': 'Source',
  'col.status': 'Status',
  'col.duration': 'Duration',
  'col.tokens': 'Tokens',
  'status.completed': 'Completed',
  'status.failed': 'Failed',
  'status.cancelled': 'Cancelled',
  'status.interrupted': 'Interrupted',
  'status.running': 'Running',
  'status.blocked_on_approval': 'Awaiting approval',
  untitled: 'Untitled chat',
};

type Key = keyof typeof en;

const zh: Record<Key, string> = {
  'dashboard.subtitle': '最近 7 天的运行情况',
  'dashboard.newChat': '新对话',
  'dashboard.runs': '运行次数',
  'dashboard.successRate': '成功率',
  'dashboard.avgDuration': '平均耗时',
  'dashboard.tokens': 'Token 用量',
  'dashboard.perDay': '每日运行',
  'dashboard.live': '正在运行',
  'dashboard.noLive': '当前没有运行中的任务。',
  'dashboard.recent': '最近运行',
  'dashboard.noRuns': '还没有运行记录——开始一次对话后会显示在这里。',
  'dashboard.loadFailed': '加载运行记录失败：{message}',
  'col.started': '开始时间',
  'col.chat': '对话',
  'col.source': '来源',
  'col.status': '状态',
  'col.duration': '耗时',
  'col.tokens': 'Tokens',
  'status.completed': '已完成',
  'status.failed': '失败',
  'status.cancelled': '已取消',
  'status.interrupted': '已中断',
  'status.running': '运行中',
  'status.blocked_on_approval': '等待审批',
  untitled: '未命名对话',
};

const MESSAGES: Record<string, Record<Key, string>> = { en, zh };

export type T = (key: Key, params?: Record<string, string | number>) => string;

export function useT(): { t: T; lang: string } {
  const { lang } = useLoviaState();
  const strings = MESSAGES[lang] ?? MESSAGES[lang.split('-')[0]] ?? en;
  const t: T = (key, params) =>
    (strings[key] ?? en[key]).replace(/\{(\w+)\}/g, (m, name) => String(params?.[name] ?? m));
  return { t, lang };
}
