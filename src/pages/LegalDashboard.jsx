import React, { useEffect, useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plane, Scale, CalendarRange, TrendingUp, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { VolumeChart } from "@/components/dashboard/VolumeChart";
import { JusticeGratuitaChart } from "@/components/dashboard/JusticeGratuitaChart";
import { TribunalFilter } from "@/components/dashboard/TribunalFilter";
import { TramitacaoCard } from "@/components/dashboard/TramitacaoCard";
import { ResultadoCard } from "@/components/dashboard/ResultadoCard";
import { GratuidadeSegmentadaChart } from "@/components/dashboard/GratuidadeSegmentadaChart";
import { SegmentacaoResumo } from "@/components/dashboard/SegmentacaoResumo";
import { ComparativoRitoCard } from "@/components/dashboard/ComparativoRitoCard";
import { DEFAULT_TRIBUNALS } from "@/lib/tribunals";
import { ConcentracaoRendaChart } from "@/components/dashboard/ConcentracaoRendaChart";

export default function LegalDashboard() {
  const [tribunals, setTribunals] = useState(DEFAULT_TRIBUNALS);
  const [volume, setVolume] = useState([]);
  const [jusG, setJusG] = useState([]);
  const [tramitacao, setTramitacao] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [segmentacao, setSegmentacao] = useState([]);
  const [porRito, setPorRito] = useState({ je: null, comum: null });
  const [meta, setMeta] = useState({ ok: [], falhas: [] });
  const [concentracao, setConcentracao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (ts) => {
    setLoading(true);
    setError(null);
    try {
      const [volRes, jgRes, trRes, segRes, trJeRes, trG1Res, concRes] = await Promise.all([
        base44.functions.invoke("fetchAviationVolume", { tribunals: ts }),
        base44.functions.invoke("fetchJusticeGratuita", { tribunals: ts }),
        base44.functions.invoke("fetchTramitacaoResultado", { tribunals: ts }),
        base44.functions.invoke("fetchSegmentacaoJustica", { tribunals: ts }),
        base44.functions.invoke("fetchTramitacaoResultado", { tribunals: ts, rito: "JE" }),
        base44.functions.invoke("fetchTramitacaoResultado", { tribunals: ts, rito: "COMUM" }),
        base44.functions.invoke("fetchConcentracaoRenda", { tribunals: ts }),
      ]);
      setConcentracao(concRes.data);
      setSegmentacao(segRes.data?.serie || []);
      setPorRito({ je: trJeRes.data, comum: trG1Res.data });
      setVolume(volRes.data?.serie || []);
      setJusG(jgRes.data?.serie || []);
      setTramitacao(trRes.data?.tramitacao || null);
      setResultado(trRes.data?.resultado || null);
      setMeta({
        ok: volRes.data?.tribunais_ok || [],
        falhas: [...(volRes.data?.tribunais_falhas || [])],
      });
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Falha ao consultar o DataJud.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tribunals);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApply = (ts) => {
    setTribunals(ts);
    load(ts);
  };

  // KPIs derivados das séries carregadas.
  const kpis = useMemo(() => {
    const totalVolume = volume.reduce((s, d) => s + (d.count || 0), 0);
    const firstMonth = volume.length ? volume[0].month : "—";
    const lastMonth = volume.length ? volume[volume.length - 1].month : "—";
    const peak = volume.reduce(
      (acc, d) => (d.count > acc.count ? d : acc),
      { month: "—", count: 0 }
    );
    const totalJG = jusG.reduce((s, d) => s + (d.total || 0), 0);
    const totalMov = jusG.reduce((s, d) => s + (d.comGratuidadeMovimento || 0), 0);
    const totalAssunto = jusG.reduce((s, d) => s + (d.comGratuidadeAssunto || 0), 0);
    const propMediaMov = totalJG ? ((totalMov / totalJG) * 100).toFixed(1) : "0.0";
    const propMediaAssunto = totalJG ? ((totalAssunto / totalJG) * 100).toFixed(1) : "0.0";
    return { totalVolume, firstMonth, lastMonth, peak, propMediaMov, propMediaAssunto };
  }, [volume, jusG]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        {/* Cabeçalho acadêmico */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              <Plane className="h-3.5 w-3.5" />
              DataJud · CNJ · Direito Aeronáutico
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
              Litigância abusiva no setor aéreo
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Volumetria histórica de processos aéreos (atraso, cancelamento e extravio de
              bagagem) extraída via agregações do Elasticsearch da API pública do DataJud.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TribunalFilter value={tribunals} onApply={onApply} />
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => load(tribunals)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar
            </Button>
          </div>
        </header>

        {/* Alertas de cobertura */}
        {meta.falhas.length > 0 && !loading && (
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600" />
            <div className="text-muted-foreground">
              {meta.falhas.length} tribunal(is) sem resposta nesta consulta
              ({meta.falhas.map((f) => f.tribunal).join(", ")}). Os demais foram agregados normalmente.
            </div>
          </div>
        )}

        {/* Estados de carregamento / erro */}
        {loading && (
          <div className="mt-12 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Consultando agregações do DataJud…</p>
          </div>
        )}

        {error && !loading && (
          <div className="mt-8 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPIs */}
            <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                icon={TrendingUp}
                label="Total de ações aéreas"
                value={kpis.totalVolume.toLocaleString("pt-BR")}
                hint={`${kpis.firstMonth} a ${kpis.lastMonth}`}
              />
              <MetricCard
                icon={CalendarRange}
                label="Mês de pico"
                value={kpis.peak.month}
                hint={`${kpis.peak.count.toLocaleString("pt-BR")} ajuizamentos`}
              />
              <MetricCard
                icon={Scale}
                label="% justiça gratuita (média)"
                value={`${kpis.propMediaMov}%`}
                hint={`Por movimento (concessão) · assunto ${kpis.propMediaAssunto}%`}
                accent="text-amber-600"
              />
              <MetricCard
                icon={Plane}
                label="Tribunais consultados"
                value={`${meta.ok.length}`}
                hint="Índices respondidos nesta consulta"
              />
            </section>

            {/* Gráficos */}
            <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <VolumeChart data={volume} />
              <JusticeGratuitaChart data={jusG} />
            </section>

            {/* Eficiência processual e desfecho do julgamento */}
            <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TramitacaoCard tramitacao={tramitacao} />
              <ResultadoCard resultado={resultado} />
            </section>

            {/* Recorte Juizado Especial × Justiça Comum */}
            <section className="mt-10 space-y-4">
              <div>
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  Juizado Especial × Justiça Comum
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
                  No JE a gratuidade é estrutural (Lei 9.099/95, art. 54) e não gera
                  movimento de deferimento; na Justiça Comum ela é um benefício real,
                  concedido caso a caso. Rito identificado pela classe processual,
                  incluindo as fases recursais de cada justiça.
                </p>
              </div>
              <SegmentacaoResumo data={segmentacao} />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <GratuidadeSegmentadaChart data={segmentacao} />
                <ComparativoRitoCard je={porRito.je} comum={porRito.comum} />
              </div>
            </section>

            {/* Concentração por renda municipal */}
            <section className="mt-10 space-y-4">
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Litigância × renda municipal
              </h2>
              <ConcentracaoRendaChart data={concentracao} />
            </section>

            {/* Rodapé metodológico */}
            <footer className="mt-10 border-t border-border/70 pt-5 text-xs text-muted-foreground space-y-1">
              <p>
                Fonte: API Pública do DataJud (CNJ). Estratégia de extração: agregações
                <code className="mx-1 rounded bg-muted px-1 py-0.5">terms</code> com
                script de normalização sobre <code className="rounded bg-muted px-1 py-0.5">dataAjuizamento</code>,
                evitando o limite de 10k hits da paginação.
              </p>
              <p>
                Critério de litigância aérea: assuntos "Atraso de vôo", "Cancelamento de vôo"
                e "Extravio de bagagem" (filtro por nome, estável nacionalmente).
              </p>
              <p>
                Justiça gratuita — dois critérios: (1) por assunto "Assistência Judiciária
                Gratuita" (TPU 10685); (2) por movimento de concessão "Gratuidade da Justiça"
                (mais fidedigno do deferimento efetivo). A divergência entre ambos evidencia
                o sub-registro da matéria como assunto.
              </p>
              <p>
                Tempo de tramitação: diferença em dias entre o último movimento
                processual e a <code className="rounded bg-muted px-1 py-0.5">dataAjuizamento</code>,
                restrita a registros com data válida. Resultado do julgamento: varredura
                dos movimentos do TPU de Magistratura (procedência, improcedência,
                procedência em parte, extinção sem resolução do mérito e transação).
              </p>
              <p>
                Tipo de justiça: definido pela <code className="rounded bg-muted px-1 py-0.5">classe</code> processual,
                que acompanha a natureza do processo em todas as instâncias. Juizado Especial:
                "Procedimento do Juizado Especial Cível", "Recurso Inominado" e demais classes
                próprias do microssistema; Justiça Comum: "Procedimento Comum Cível", "Apelação
                Cível" e congêneres. Desempate para as demais classes genéricas (embargos,
                petições): pelo <code className="rounded bg-muted px-1 py-0.5">grau</code> —
                JE e turmas recursais (TR/TRU/TNU) para o Juizado; G1, G2 e demais para a Justiça
                Comum. O recorte cobre o mesmo universo do gráfico de volume, de modo que JE +
                Justiça Comum + cumprimento de sentença = total de ações aéreas.
              </p>
              <p>
                Cumprimento de sentença: individualizado em categoria própria. No DataJud, ao
                iniciar a execução do julgado o processo passa a ser registrado com a classe
                "Cumprimento de sentença" (ou "Cumprimento Provisório de Sentença/Decisão"),
                perdendo a classe original que indicaria o rito. Esse registro não representa
                nova demanda, mas a fase executiva de uma ação já ajuizada; por isso não é
                atribuído ao Juizado nem à Justiça Comum, evitando inflar a distribuição de
                qualquer dos ritos com uma classificação por mera inferência de grau. Também é
                excluído do comparativo de tramitação e resultado por rito.
              </p>
              <p>
                Índice de concentração (Gini adaptado, sem dados de renda dos autores): municípios
                ordenados pelo PIB per capita (PIB dos Municípios 2023 / população do Censo 2022,
                IBGE-SIDRA); área entre a curva e a diagonal, calculada por trapézio. Valor positivo
                indica concentração nos municípios mais ricos. Contam apenas ações originárias
                (graus JE e G1), sem cumprimento de sentença, atribuídas ao município da vara
                (<code className="rounded bg-muted px-1 py-0.5">orgaoJulgador.codigoMunicipioIBGE</code>).
                Universo: todos os municípios das UFs dos TJs consultados, inclusive os sem ações.
                Quando o município não é informado (sobretudo no TJSP), ele é recuperado pelo nome
                da vara; foros regionais da Capital são atribuídos a São Paulo, e o foro de Vila
                Mimosa, a Campinas. Varas sem localidade no nome (ex.: CEJUSC pré-processual) ficam
                de fora. Limitação: a comarca pode abranger vários municípios, e a ação é atribuída
                à sede da vara.
              </p>
              <p>
                Cobertura: 22 tribunais (TJs e TRFs), incluindo o TJDFT (índice
                <code className="mx-1 rounded bg-muted px-1 py-0.5">api_publica_tjdft</code>).
                O TJRS, de índice mais pesado, é consultado à parte após os demais, com nova
                tentativa em caso de falha, para garantir sua inclusão em todas as cargas.
              </p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}