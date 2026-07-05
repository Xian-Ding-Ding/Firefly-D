/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

declare global {
	interface ImportMetaEnv {
		readonly MEILI_MASTER_KEY: string;
		readonly PUBLIC_UMAMI_WEBSITE_ID?: string;
		readonly PUBLIC_UMAMI_SCRIPT_URL?: string;
		readonly PUBLIC_UMAMI_DASHBOARD_URL?: string;
		readonly PUBLIC_UMAMI_SHARE_URL?: string;
	}

	interface ITOCManager {
		init: () => void;
		cleanup: () => void;
	}

	interface Window {
		SidebarTOC: {
			manager: ITOCManager | null;
		};
		FloatingTOC: {
			btn: HTMLElement | null;
			panel: HTMLElement | null;
			manager: ITOCManager | null;
			isPostPage: () => boolean;
		};
		toggleFloatingTOC: () => void;
		tocInternalNavigation: boolean;
		// swup is defined in global.d.ts
		// biome-ignore lint/suspicious/noExplicitAny: External library without types
		spine: any;
		closeAnnouncement: () => void;
		// __fireflyMusic type is defined in global.d.ts
		semifullScrollHandler?: (() => void) | undefined;
		initSemifullScrollDetection?: () => void;
	}
}

export {};
