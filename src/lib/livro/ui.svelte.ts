export interface ToastData {
	m: string;
	u?: () => void;
}

export class UIStore {
	dark = $state(false);
	priv = $state(false);
	toast = $state<ToastData | null>(null);
	cmd = $state(false);
	q = $state('');
	closeStep = $state(-1);
	panel = $state<unknown>(null);
	picker = $state<unknown>(null);
	hist = $state<string[]>([]);

	toggleDark() {
		this.dark = !this.dark;
	}

	togglePriv() {
		this.priv = !this.priv;
	}

	showToast(m: string, u?: () => void) {
		this.toast = { m, u };
	}

	clearToast() {
		this.toast = null;
	}

	openCmd() {
		this.cmd = true;
		this.q = '';
	}

	closeCmd() {
		this.cmd = false;
	}

	openClose() {
		this.closeStep = 0;
	}

	closeX() {
		this.closeStep = -1;
	}

	pushHist(route: string) {
		this.hist = [...this.hist, route];
	}

	popHist(): string | undefined {
		if (this.hist.length === 0) return undefined;
		const last = this.hist[this.hist.length - 1];
		this.hist = this.hist.slice(0, -1);
		return last;
	}
}

export const uiStore = new UIStore();
