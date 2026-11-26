import type { Ledger } from './ledger';

export interface LedgerFilter {
	cat?: string;
	label: string;
}

export class LedgerContextStore {
	per = $state(0);
	esc = $state(0);
	base = $state(0);
	filt = $state<LedgerFilter | null>(null);
	ledger = $state<Ledger | null>(null);
	real = $state(false);
	ledgerError = $state(false);

	cyclePer() {
		this.per = (this.per + 1) % 3;
	}

	cycleEsc(maxEscopos = 5) {
		this.esc = (this.esc + 1) % maxEscopos;
	}

	toggleBase() {
		this.base = this.base ? 0 : 1;
	}

	clearFilt() {
		this.filt = null;
	}

	setLedger(ledger: Ledger | null, isReal = false) {
		this.ledger = ledger;
		this.real = isReal;
		this.ledgerError = false;
	}

	setError(err = true) {
		this.ledgerError = err;
	}
}

export const ledgerContext = new LedgerContextStore();
