/**
 * Fixtures estáticas de demonstração e protótipo do livro-caixa.
 */

export interface MockRow {
	id: number;
	date: string;
	loja: string;
	titulo: string;
	cat: string | null;
	parc: string;
	total: number;
	pago: number;
	orig: string;
	sub?: boolean;
	trip?: string;
	lock?: boolean;
	extra?: boolean;
}

export interface MockPend {
	id: number;
	loja: string;
	titulo: string;
	date: string;
	v: number;
	sug: string;
	conf: number;
}

export const MOCK_ROWS: MockRow[] = [
	{
		id: 1,
		date: '23/11',
		loja: 'Zaffari',
		titulo: 'Compra do mês',
		cat: 'Mercado',
		parc: '1/1',
		total: 412.8,
		pago: 412.8,
		orig: 'Cartão'
	},
	{
		id: 2,
		date: '22/11',
		loja: 'Outback',
		titulo: 'Jantar de aniversário',
		cat: 'Restaurantes',
		parc: '1/1',
		total: 286,
		pago: 286,
		orig: 'Cartão'
	},
	{
		id: 3,
		date: '21/11',
		loja: 'Amazon',
		titulo: 'Mochila escolar da Olivia',
		cat: null,
		parc: '1/3',
		total: 389.7,
		pago: 129.9,
		orig: 'Amazon'
	},
	{
		id: 4,
		date: '20/11',
		loja: 'Netflix',
		titulo: 'Assinatura mensal',
		cat: 'Assinaturas',
		parc: '1/1',
		total: 55.9,
		pago: 55.9,
		orig: 'Cartão',
		sub: true
	},
	{
		id: 5,
		date: '19/11',
		loja: 'Droga Raia',
		titulo: 'Remédios',
		cat: 'Saúde',
		parc: '1/1',
		total: 148.3,
		pago: 148.3,
		orig: 'Pix'
	},
	{
		id: 6,
		date: '18/11',
		loja: 'Mercado Livre',
		titulo: 'Cadeira de escritório',
		cat: null,
		parc: '3/10',
		total: 1890,
		pago: 567,
		orig: 'Mercado Livre'
	},
	{
		id: 7,
		date: '17/03',
		loja: 'TAP Air Portugal',
		titulo: 'Passagens Lisboa (fora do período)',
		cat: 'Viagens',
		parc: '6/10',
		total: 7800,
		pago: 4680,
		orig: 'E-mail',
		trip: 'lisboa',
		lock: true
	},
	{
		id: 8,
		date: '16/11',
		loja: 'Condomínio Villa Verde',
		titulo: 'Condomínio',
		cat: 'Moradia',
		parc: '1/1',
		total: 1480,
		pago: 1480,
		orig: 'Boleto'
	},
	{
		id: 9,
		date: '15/11',
		loja: 'Uber',
		titulo: 'Corridas da semana',
		cat: 'Transporte',
		parc: '1/1',
		total: 92.4,
		pago: 92.4,
		orig: 'Cartão'
	},
	{
		id: 10,
		date: '14/11',
		loja: 'Escola Pequeno Sol',
		titulo: 'Mensalidade',
		cat: 'Educação',
		parc: '1/1',
		total: 800,
		pago: 800,
		orig: 'Boleto'
	},
	{
		id: 11,
		date: '12/11',
		loja: 'Cinemark',
		titulo: 'Cinema em família',
		cat: 'Lazer',
		parc: '1/1',
		total: 118,
		pago: 118,
		orig: 'Cartão'
	},
	{
		id: 12,
		date: '10/11',
		loja: 'Clínica Sorriso',
		titulo: 'Dentista (extraordinário)',
		cat: 'Saúde',
		parc: '2/4',
		total: 1400,
		pago: 700,
		orig: 'Cartão',
		extra: true
	}
];

export const MOCK_PEND: MockPend[] = [
	{
		id: 3,
		loja: 'Amazon',
		titulo: 'Mochila escolar',
		date: '21/11',
		v: 389.7,
		sug: 'Educação',
		conf: 92
	},
	{
		id: 6,
		loja: 'Mercado Livre',
		titulo: 'Cadeira',
		date: '18/11',
		v: 1890,
		sug: 'Compras',
		conf: 74
	},
	{
		id: 21,
		loja: 'Padaria Sol',
		titulo: 'Café da manhã',
		date: '17/11',
		v: 64.2,
		sug: 'Restaurantes',
		conf: 92
	},
	{
		id: 22,
		loja: 'Posto Ipiranga',
		titulo: 'Combustível',
		date: '16/11',
		v: 210,
		sug: 'Transporte',
		conf: 95
	},
	{
		id: 23,
		loja: 'Pague Menos',
		titulo: 'Farmácia',
		date: '15/11',
		v: 96.4,
		sug: 'Saúde',
		conf: 90
	},
	{
		id: 24,
		loja: 'Shopee',
		titulo: 'Capinha de celular',
		date: '13/11',
		v: 58,
		sug: 'Compras',
		conf: 70
	},
	{
		id: 25,
		loja: 'Pix Dona Neide',
		titulo: 'Transferência',
		date: '11/11',
		v: 350,
		sug: 'Ajuda familiar',
		conf: 41
	}
];

export const MOCK_RULES: [string, string, number][] = [
	['Loja contém “Zaffari”', 'Mercado', 142],
	['Netflix | Spotify | Disney', 'Assinaturas', 36],
	['Uber | 99', 'Transporte', 88],
	['Escola Pequeno Sol', 'Educação', 11],
	['Posto *', 'Transporte', 40],
	['Padaria *', 'Restaurantes', 52],
	['Casas Bahia', 'Compras', 0]
];

export const MOCK_CATS: Record<string, string> = {
	Moradia: 'N',
	Mercado: 'N',
	Saúde: 'N',
	Transporte: 'N',
	Educação: 'N',
	Restaurantes: 'D',
	Lazer: 'D',
	Compras: 'D',
	Assinaturas: 'D',
	Viagens: 'D',
	Previdência: 'F',
	Reserva: 'F',
	'Poupança da Olivia': 'F'
};

export const MOCK_CV: [string, number, number][] = [
	['Moradia', 5200, 5200],
	['Mercado', 2640, 3050],
	['Saúde', 1210, 980],
	['Transporte', 1050, 1450],
	['Educação', 800, 800],
	['Restaurantes', 1710, 1980],
	['Lazer', 1160, 1210],
	['Compras', 650, 2300],
	['Assinaturas', 560, 1180]
];

export const MOCK_MN = [
	'Jan',
	'Fev',
	'Mar',
	'Abr',
	'Mai',
	'Jun',
	'Jul',
	'Ago',
	'Set',
	'Out',
	'Nov',
	'Dez'
];

export const MOCK_SER = [
	17200, 16400, 18100, 17000, 17900, 20800, 18600, 22400, 17600, 18400, 19610, 21800
];

export const MOCK_STORES: Record<string, [string, number][]> = {
	Moradia: [
		['Aluguel · Imobiliária Prime', 3200],
		['Condomínio Villa Verde', 1480],
		['Enel Energia', 520]
	],
	Mercado: [
		['Zaffari', 1480],
		['Pão de Açúcar', 720],
		['Hortifruti Vila', 440]
	],
	Saúde: [
		['Clínica Sorriso', 700],
		['Droga Raia', 310],
		['Unimed', 200]
	],
	Transporte: [
		['Posto Ipiranga', 560],
		['Uber', 290],
		['99', 200]
	],
	Educação: [['Escola Pequeno Sol', 800]],
	Restaurantes: [
		['Outback', 286],
		['Madero', 430],
		['Padaria Sol', 380]
	],
	Lazer: [
		['Cinemark', 118],
		['Parque Aquático', 640],
		['Livraria Cultura', 400]
	],
	Compras: [
		['Amazon', 390],
		['Shopee', 58],
		['Leroy Merlin', 202]
	],
	Assinaturas: [
		['Netflix', 56],
		['Spotify', 35],
		['iCloud', 29]
	]
};

export const MOCK_TRIPS: Record<
	string,
	{
		nome: string;
		dest: string;
		datas: string;
		dias: number;
		nota: string;
		c: [string, string, string, string, number, number, boolean][];
	}
> = {
	lisboa: {
		nome: 'Lisboa e Porto',
		dest: 'Lisboa',
		datas: '04/07 – 24/07',
		dias: 21,
		nota: 'Três semanas com a Olivia: Alfama, Sintra de trem e dois dias no Porto. O pastel de Belém virou rotina.',
		c: [
			['17/03', 'TAP Air Portugal', '3 passagens', 'Passagens', 7800, 4680, true],
			['02/05', 'Booking · Casa Alfama', '14 noites', 'Hospedagem', 3900, 3900, true],
			['30/05', 'Airbnb Porto', '7 noites', 'Hospedagem', 1300, 1300, true],
			['05–23/07', 'Restaurantes', '11 compras no exterior', 'Alimentação', 3100, 3100, true],
			['06–22/07', 'Metrô, trem e táxi', '', 'Transporte', 900, 900, true],
			['10/07', 'Passeios Douro e Pena', '', 'Passeios', 760, 760, true],
			['20/05', 'Seguro viagem', 'fora do período', 'Outros', 480, 480, true],
			['08/07', 'GetYourGuide', 'Passeio Sintra', 'Passeios', 640, 0, false]
		]
	},
	gramado: {
		nome: 'Gramado',
		dest: 'Gramado',
		datas: '28/03 – 05/04',
		dias: 9,
		nota: 'Páscoa na serra, chocolate quente e frio de verdade.',
		c: [
			['10/02', 'Azul Linhas Aéreas', 'passagens', 'Passagens', 2200, 2200, true],
			['10/02', 'Pousada Bela Vista', '8 noites', 'Hospedagem', 2680, 2680, true],
			['28/03–05/04', 'Restaurantes', '', 'Alimentação', 960, 960, true],
			['29/03', 'Aluguel de carro', '', 'Transporte', 520, 520, true],
			['01/04', 'Snowland', 'ingressos', 'Passeios', 290, 0, false]
		]
	},
	trabalho: {
		nome: 'São Paulo · trabalho',
		dest: 'São Paulo',
		datas: '14/09 – 17/09',
		dias: 4,
		nota: 'Congresso de finanças. Pago pela empresa: não entra no custo pessoal.',
		c: [
			['01/09', 'Passagens (reembolsadas)', 'empresa', 'Passagens', 1120, 1120, false],
			['14/09', 'Hotel Paulista (reembolsado)', 'empresa', 'Hospedagem', 1480, 1480, false]
		]
	}
};

export const MOCK_PROJ: Record<
	string,
	{
		nome: string;
		per: string;
		ic: string;
		orc: number;
		items: [string, string, number][];
	}
> = {
	cozinha: {
		nome: 'Reforma da cozinha',
		per: '12/08 – 30/10',
		ic: 'ph ph-hammer',
		orc: 40000,
		items: [
			['14/08', 'Marcenaria Pinheiro', 18500],
			['20/08', 'Eletro: fogão e coifa', 6900],
			['02/09', 'Pedreiro e azulejista', 3800],
			['15/09', 'Leroy Merlin', 4200],
			['10/10', 'Pintura', 2100],
			['22/10', 'Louças e torneira', 1650]
		]
	},
	festa: {
		nome: 'Aniversário da Olivia',
		per: '01/09 – 14/09',
		ic: 'ph ph-cake',
		orc: 4500,
		items: [
			['01/09', 'Buffet Mundo Mágico', 2800],
			['08/09', 'Bolo e doces', 450],
			['10/09', 'Lembrancinhas', 380],
			['12/09', 'Decoração', 520]
		]
	},
	quarto: {
		nome: 'Quarto da Olivia',
		per: '05/11 – 30/11',
		ic: 'ph ph-bed',
		orc: 5500,
		items: [
			['05/11', 'Marcenaria sob medida', 3100],
			['12/11', 'Colchão', 1600]
		]
	}
};
