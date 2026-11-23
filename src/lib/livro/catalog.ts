/** Rótulos do livro. Sem valores. A filha está no cadastro como "Filha"; o nome é Olivia. */
export const PESSOAS = 'Daniel, Mariana, Olivia (filha), Lilian (mãe), Sônia, Thiago (irmão)';

export const CONTAS = 'Itaú, Banco do Brasil, Bradesco, Mercado Pago';

export type Cat = { id: string; nome: string; bloco: 'N' | 'D' | 'F' | '' };

const B = { necessidade: 'N', desejo: 'D', futuro: 'F' } as const;

function row(id: string, nome: string, bloco: keyof typeof B | ''): Cat {
	return { id, nome, bloco: bloco ? B[bloco] : '' };
}

export const CATEGORIAS: Cat[] = [
	row('condominio', 'Condomínio', 'necessidade'),
	row('agua', 'Água e esgoto', 'necessidade'),
	row('energia', 'Energia elétrica e gás', 'necessidade'),
	row('manutencao_casa', 'Manutenção da casa', 'necessidade'),
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
