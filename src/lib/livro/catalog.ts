/** Rótulos do livro. Sem valores. A filha está no cadastro como "Filha"; o nome é Olivia. */
export const PESSOAS = 'Daniel, Mariana, Olivia (filha), Lilian (mãe), Sônia, Thiago (irmão)';

export const CONTAS = 'Itaú, Banco do Brasil, Bradesco, Mercado Pago';

export type Cat = {
	id: string;
	nome: string;
	bloco: 'N' | 'D' | 'F' | '';
	coicop?: string;
};

const B = { necessidade: 'N', desejo: 'D', futuro: 'F' } as const;

export const COICOP_DIVISOES: Record<string, { codigo: string; nome: string }> = {
	'01': { codigo: '01', nome: 'Alimentos e bebidas não alcoólicas' },
	'02': { codigo: '02', nome: 'Bebidas alcoólicas, tabaco e narcóticos' },
	'03': { codigo: '03', nome: 'Vestuário e calçados' },
	'04': { codigo: '04', nome: 'Habitação, água, luz e gás' },
	'05': { codigo: '05', nome: 'Mobília e serviços domésticos' },
	'06': { codigo: '06', nome: 'Saúde' },
	'07': { codigo: '07', nome: 'Transporte' },
	'08': { codigo: '08', nome: 'Informação e comunicação' },
	'09': { codigo: '09', nome: 'Recreação, esporte e cultura' },
	'10': { codigo: '10', nome: 'Serviços de educação' },
	'11': { codigo: '11', nome: 'Restaurantes e hospedagem' },
	'12': { codigo: '12', nome: 'Seguros e serviços financeiros' },
	'13': { codigo: '13', nome: 'Cuidados pessoais e outros serviços' },
	X: { codigo: 'X', nome: 'Investimentos, ajudas e impostos' },
	OUTROS: { codigo: 'OUTROS', nome: 'Diversos e não classificado' }
};

export const CAT_COICOP_MAP: Record<string, string> = {
	mercado: '01.1',
	alcool: '02.1',
	tabaco: '02.3',
	vestuario: '03.1',
	manutencao_casa: '04.3',
	repasse_casa: '04.1',
	condominio: '04.4',
	agua: '04.4',
	energia: '04.5',
	casa_itens: '05.1',
	servico_domestico: '05.6',
	medicamentos: '06.1',
	consultas: '06.2',
	plano_saude: '12.1',
	veiculo_uso: '07.2',
	transporte_passageiros: '07.3',
	eletronicos: '08.1',
	software_ia: '08.2',
	telecom: '08.3',
	jogos_brinquedos: '09.2',
	pets: '09.3',
	lazer: '09.4',
	apostas: '09.4',
	streaming: '09.6',
	livros: '09.7',
	escola: '10.1',
	cursos: '10.5',
	cantina_escolar: '11.1',
	restaurantes: '11.1',
	viagens: '11.2',
	seguros: '12.1',
	tarifas: '12.2',
	taxas_invest: '12.2',
	cuidados_pessoais: '13.1',
	seguranca: '13.9',
	servicos_diversos: '13.9',
	aporte: 'X.1',
	resgate: 'X.1',
	mineracao: 'X.1',
	ajuda_familiar: 'X.2',
	impostos: 'X.3',
	emprestimo: 'X.4',
	compras: 'OUTROS',
	dinheiro_vivo: 'OUTROS',
	outros: 'OUTROS',
	cartao_sem_detalhe: 'OUTROS'
};

export function divisaoDe(catId: string | null | undefined): { codigo: string; nome: string } {
	if (!catId) return COICOP_DIVISOES['OUTROS'];
	const coicop = CAT_COICOP_MAP[catId] || '';
	const code = coicop.startsWith('X') ? 'X' : coicop.slice(0, 2) || 'OUTROS';
	return COICOP_DIVISOES[code] || COICOP_DIVISOES['OUTROS'];
}

function row(id: string, nome: string, bloco: keyof typeof B | ''): Cat {
	return { id, nome, bloco: bloco ? B[bloco] : '', coicop: CAT_COICOP_MAP[id] };
}

export const CATEGORIAS: Cat[] = [
	row('condominio', 'Condomínio', 'necessidade'),
	row('agua', 'Água e esgoto', 'necessidade'),
	row('energia', 'Energia elétrica e gás', 'necessidade'),
	row('manutencao_casa', 'Manutenção da casa', 'necessidade'),
	row('repasse_casa', 'Repasse para a Casa', 'necessidade'),
	row('servico_domestico', 'Serviço doméstico (Sônia)', 'necessidade'),
	row('casa_itens', 'Móveis e utensílios', 'desejo'),
	row('seguranca', 'Segurança (vigias)', 'necessidade'),
	row('alcool', 'Bebidas alcoólicas (bar, cervejaria)', 'desejo'),
	row('tabaco', 'Cigarro (tabaco)', 'desejo'),
	row('mercado', 'Supermercado e feira', 'necessidade'),
	row('cantina_escolar', 'Cantina escolar', 'necessidade'),
	row('restaurantes', 'Restaurantes, bares e delivery', 'desejo'),
	row('vestuario', 'Roupas e calçados', 'desejo'),
	row('medicamentos', 'Farmácia e medicamentos', 'necessidade'),
	row('consultas', 'Consultas, exames e terapias', 'necessidade'),
	row('plano_saude', 'Plano de saúde', 'necessidade'),
	row('seguros', 'Seguros', 'necessidade'),
	row('veiculo_uso', 'Carro: combustível, pedágio e manutenção', 'necessidade'),
	row('transporte_passageiros', 'Aplicativos, ônibus e passagens', 'desejo'),
	row('telecom', 'Internet, celular e TV', 'necessidade'),
	row('software_ia', 'Software e IA', 'desejo'),
	row('eletronicos', 'Eletrônicos', 'desejo'),
	row('streaming', 'Streaming e assinaturas', 'desejo'),
	row('lazer', 'Lazer e esporte', 'desejo'),
	row('apostas', 'Loterias e apostas', 'desejo'),
	row('jogos_brinquedos', 'Jogos e brinquedos', 'desejo'),
	row('pets', 'Pets e jardim', 'desejo'),
	row('livros', 'Livros e papelaria', 'desejo'),
	row('viagens', 'Viagens e hospedagem', 'desejo'),
	row('escola', 'Escola (filha)', 'necessidade'),
	row('cursos', 'Cursos e formação', 'necessidade'),
	row('cuidados_pessoais', 'Cuidados pessoais', 'desejo'),
	row('servicos_diversos', 'Serviços diversos (cartório, correios)', 'necessidade'),
	row('tarifas', 'Tarifas, juros e IOF', 'necessidade'),
	row('impostos', 'Impostos e taxas (IPTU, IPVA)', 'necessidade'),
	row('ajuda_familiar', 'Ajuda a familiares', 'necessidade'),
	row('compras', 'Compras diversas (a detalhar)', 'desejo'),
	row('dinheiro_vivo', 'Saque em dinheiro', 'desejo'),
	row('taxas_invest', 'Custos de investimento', 'futuro'),
	row('outros', 'Não classificado', ''),
	row('cartao_sem_detalhe', 'Cartão (fatura sem detalhe)', ''),
	row('aporte', 'Aporte em investimento', 'futuro'),
	row('resgate', 'Resgate / venda de investimento', 'futuro'),
	row('mineracao', 'Mineradora de ETH (Maricoins)', 'futuro')
];

const POR_ID = new Map(CATEGORIAS.map((c) => [c.id, c]));

export function categoria(id: string | null | undefined): Cat {
	if (!id) return { id: '', nome: 'Sem classificar', bloco: '' };
	return POR_ID.get(id) ?? { id, nome: id, bloco: '' };
}

export function blocoDe(nome: string): 'N' | 'D' | 'F' | null {
	const hit = CATEGORIAS.find((c) => c.nome === nome);
	return hit?.bloco ? hit.bloco : null;
}

export const ESCOPOS = [
	{ id: null, nome: 'Casa, pessoal e família' },
	{ id: 'casa', nome: 'Casa' },
	{ id: 'pessoal', nome: 'Pessoal' },
	{ id: 'familia', nome: 'Família' }
] as const;

export function escopoNome(id: string | null | undefined): string {
	if (id === 'casa') return 'Casa';
	if (id === 'pessoal') return 'Pessoal';
	if (id === 'familia') return 'Família';
	return id || '';
}

const MESES = [
	'janeiro',
	'fevereiro',
	'março',
	'abril',
	'maio',
	'junho',
	'julho',
	'agosto',
	'setembro',
	'outubro',
	'novembro',
	'dezembro'
];

export function rotuloMes(ano: number, mes: number): string {
	const nome = MESES[mes - 1] ?? '';
	return nome.charAt(0).toUpperCase() + nome.slice(1) + ' ' + ano;
}

export const PENDENTE = new Set(['outros', 'cartao_sem_detalhe', '']);
