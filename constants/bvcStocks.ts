export interface BvcStock {
  ticker: string;
  name: string;
  sector: string;
}

export const BVC_STOCKS: BvcStock[] = [
  // Banques
  { ticker: 'ATW',  name: 'Attijariwafa Bank',          sector: 'Banques' },
  { ticker: 'BCP',  name: 'Banque Centrale Populaire',  sector: 'Banques' },
  { ticker: 'BOA',  name: 'Bank of Africa',             sector: 'Banques' },
  { ticker: 'CIH',  name: 'CIH Bank',                   sector: 'Banques' },
  { ticker: 'CDM',  name: 'Crédit du Maroc',            sector: 'Banques' },
  { ticker: 'CFG',  name: 'CFG Bank',                   sector: 'Banques' },
  // Télécom
  { ticker: 'IAM',  name: 'Maroc Telecom',              sector: 'Télécom' },
  // Assurances
  { ticker: 'WAA',  name: 'Wafa Assurance',             sector: 'Assurances' },
  { ticker: 'SAH',  name: 'Saham Assurance',            sector: 'Assurances' },
  { ticker: 'CNIA', name: 'CNIA Saada Assurance',       sector: 'Assurances' },
  // Mines
  { ticker: 'MNG',  name: 'Managem',                    sector: 'Mines' },
  { ticker: 'SMI',  name: 'SMI',                        sector: 'Mines' },
  { ticker: 'CMT',  name: 'Cie Minière de Touissit',   sector: 'Mines' },
  // Énergie
  { ticker: 'GAZ',  name: 'Afriquia Gaz',               sector: 'Énergie' },
  { ticker: 'TMA',  name: 'Total Énergies Maroc',       sector: 'Énergie' },
  { ticker: 'SNP',  name: 'Sonasid',                    sector: 'Énergie' },
  // Grande distribution
  { ticker: 'LBV',  name: "Label'Vie",                  sector: 'Distribution' },
  { ticker: 'DARI', name: 'Dari Couspate',              sector: 'Agroalimentaire' },
  { ticker: 'CDA',  name: 'Centrale Danone',            sector: 'Agroalimentaire' },
  // Immobilier
  { ticker: 'ADI',  name: 'Addoha',                     sector: 'Immobilier' },
  { ticker: 'RIS',  name: 'Risma',                      sector: 'Immobilier' },
  { ticker: 'MFM',  name: 'Maghrebail',                 sector: 'Immobilier' },
  // Industrie
  { ticker: 'HPS',  name: 'HPS',                        sector: 'Technologie' },
  { ticker: 'SRM',  name: 'Stroc Industrie',            sector: 'Industrie' },
  { ticker: 'MAB',  name: 'Maghreb Oxygène',            sector: 'Industrie' },
  { ticker: 'TQM',  name: 'TotalEnergies Mktg Maroc',  sector: 'Distribution' },
  { ticker: 'MSA',  name: 'Mutandis',                   sector: 'Industrie' },
  { ticker: 'NEJ',  name: 'Novec',                      sector: 'Industrie' },
];
