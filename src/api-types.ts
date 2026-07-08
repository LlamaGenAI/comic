export type ComicGenerationStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'LOADING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'PROCESSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | (string & {});

export const SUPPORTED_COMIC_SIZES = [
  '1024x1024',
  '512x768',
  '512x1024',
  '576x1024',
  '768x1024',
  '1024x768',
  '768x512',
  '1024x576',
  '1024x512'
] as const;

export type ComicSize = (typeof SUPPORTED_COMIC_SIZES)[number];

export interface ComicPagination {
  totalPages: number;
  panelsPerPage: number;
  [key: string]: unknown;
}

export interface ComicRole {
  name: string;
  image?: string;
  age?: number | string;
  gender?: string;
  clothing?: string;
  description?: string;
  [key: string]: unknown;
}

export interface ComicLocation {
  name: string;
  image?: string;
  description?: string;
  [key: string]: unknown;
}

export interface ComicAttachment {
  url: string;
  type?: 'image' | 'document' | 'video' | (string & {});
  [key: string]: unknown;
}

export interface CreateComicParams {
  prompt: string;
  size?: ComicSize;
  model?: string;
  preset?: string;
  style?: string;
  promptUrl?: string;
  fixPanelNum?: number;
  pagination?: ComicPagination;
  images?: string[];
  comicRoles?: ComicRole[];
  comicLocations?: ComicLocation[];
  attachments?: ComicAttachment[];
  language?: string;
  upscale?: boolean | '2K' | '4K' | (string & {});
  [key: string]: unknown;
}

export interface ComicPanel {
  assetUrl?: string;
  image?: string;
  caption?: string;
  page?: number;
  panel?: number;
  [key: string]: unknown;
}

export interface ComicEntity {
  panels?: ComicPanel[];
  page?: number;
  [key: string]: unknown;
}

export interface ComicUsageDelta {
  amount?: number;
  unit?: string;
  total_comics?: number;
  redraw_panels?: number;
  [key: string]: unknown;
}

export interface ComicArtworkResponse {
  id: string;
  status: ComicGenerationStatus;
  prompt?: string;
  artwork?: Record<string, unknown>;
  panels?: ComicPanel[];
  panel?: ComicPanel;
  output?: string;
  createdAt?: string;
  comics?: ComicEntity[];
  comicData?: unknown;
  pagination?: ComicPagination;
  usage?: ComicUsageDelta;
  [key: string]: unknown;
}

export interface GetComicOptions {
  page?: number;
  panel?: number;
}

export interface ContinueComicParams {
  prompt: string;
  fixPanelNum?: number;
  pagination?: ComicPagination;
  attachments?: ComicAttachment[];
  images?: string[];
  [key: string]: unknown;
}

export interface UpdateComicPanelParams {
  page?: number;
  pageIndex?: number;
  page_index?: number;
  panel?: number;
  panelIndex?: number;
  panel_index?: number;
  panelPrompt?: string;
  prompt?: string;
  panel_prompt?: string;
  images?: string[];
  images_url?: string | string[];
  caption?: string;
  [key: string]: unknown;
}

export interface ComicUsage {
  apiUsageCount?: number;
  apiMaxUsage?: number;
  credits?: number;
  isPaidPlan?: boolean;
  [key: string]: unknown;
}

export interface ComicUploadResponse {
  code?: number;
  fileUrl: string;
  [key: string]: unknown;
}

export type AnimationGenerationStatus = ComicGenerationStatus;

export interface AnimationVideoOptions {
  duration?: number;
  resolution?: '480p' | '720p' | '1080p' | '4k' | (string & {});
  aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | (string & {});
  image?: string;
  last_frame_image?: string;
  reference_images?: string[];
  reference_videos?: string[];
  reference_audios?: string[];
  generate_audio?: boolean;
  seed?: number;
  [key: string]: unknown;
}

export interface CreateAnimationParams {
  prompt: string;
  videoOptions?: AnimationVideoOptions;
  [key: string]: unknown;
}

export interface AnimationArtworkResponse {
  id: string;
  status: AnimationGenerationStatus;
  prompt?: string;
  output?: string;
  videoUrl?: string;
  artwork?: Record<string, unknown>;
  videoOptions?: AnimationVideoOptions;
  usage?: ComicUsageDelta;
  createdAt?: string;
  [key: string]: unknown;
}

export interface WaitForCompletionOptions {
  intervalMs?: number;
  timeoutMs?: number;
  doneStatuses?: string[];
}

export interface ErrorResponseBody {
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export interface BatchCreateOptions {
  concurrency?: number;
  stopOnError?: boolean;
}

export interface BatchCreateItemResult {
  input: CreateComicParams;
  result?: ComicArtworkResponse;
  error?: unknown;
}

export interface WaitManyOptions extends WaitForCompletionOptions {
  concurrency?: number;
}

export type WebhookEventType =
  | 'comic.generation.created'
  | 'comic.generation.updated'
  | 'comic.generation.completed'
  | 'comic.generation.failed'
  | (string & {});

export interface WebhookEvent<TData = unknown> {
  id?: string;
  type: WebhookEventType;
  created?: number;
  data: TData;
  requestId?: string;
  [key: string]: unknown;
}

export interface WebhookVerificationOptions {
  toleranceSeconds?: number;
  now?: number;
}
