export type MesDoc = {
	mes: string;
	escopo: string;
	categoria_id: string;
	custo_recorrente: number;
	custo_extraordinario: number;
};

export type CompraDoc = {
	id: string;
	data: string;
	loja: string;
	titulo: string;
	valor_total_centavos: number;
	categoria_id: string | null;
	escopo: string;
};

export type SankeyDoc = {
	periodo: string;
	origem: string;
	destino: string;
	valor: number;
	nivel: number;
};
