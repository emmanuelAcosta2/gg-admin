const pesos = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 });

/** 2500 -> "$ 2.500" */
export const formatPesos = (n: number) => `$ ${pesos.format(n)}`;
