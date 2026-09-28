import React, { useState, useMemo } from "react";
import { useQueries, useQueryClient, useIsFetching } from "@tanstack/react-query";
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
import { AnalysisCarousel } from "@/components/dashboard/AnalysisCarousel";
import { Analise } from "@/components/dashboard/Analise";
import { analiseQuery, limparCacheAnalises } from "@/lib/analiseCache";
import { notaVolume, notaGratuidade, notaTramitacao, notaRito, notaConcentracao, notaLotes, notaIncentivos, notaTipoDano, notaTema, notaPredatoria, notaAcesso, notaParados } from "@/components/dashboard/notasMetodologicas";
import { AcessoPassageirosChart } from "@/components/dashboard/AcessoPassageirosChart";
import { AcessoPassageirosSerie } from "@/components/dashboard/AcessoPassageirosSerie";
import { ProcessosParadosPerfil } from "@/components/dashboard/ProcessosParadosPerfil";
import { TemaEventoChart } from "@/components/dashboard/TemaEventoChart";
import { TemaSuspensosPerfil } from "@/components/dashboard/TemaSuspensosPerfil";
import { PredatoriaTable } from "@/components/dashboard/PredatoriaTable";
import { LotesChart } from "@/components/dashboard/LotesChart";
import { IncentivosTable } from "@/components/dashboard/IncentivosTable";
import { TipoDanoChart } from "@/components/dashboard/TipoDanoChart";
import { SazonalidadeChart } from "@/components/dashboard/SazonalidadeChart";

const grid2 = "grid grid-cols-1 gap-4 lg:grid-cols-2";

export default function LegalDashboard() {
  const [tribunals, setTribunals] = useState(DEFAULT_TRIBUNALS);
  const queryClient = useQueryClient();
  const carregando = useIsFetching({ queryKey: ["analise"] }) > 0;
  const p = { tribunals };

  // Os indicadores do topo dependem de volume e gratuidade; as demais análises
  // só são consultadas quando a aba correspondente é aberta.
  const [volQ, jgQ] = useQueries({ queries: [analiseQuery("fetchAviationVolume", p), analiseQuery("fetchJusticeGratuita", p)] });
  const volume = volQ.data?.serie || [];
  const jusG = jgQ.data?.serie || [];
  const meta = { ok: volQ.data?.tribunais_ok || [], falhas: volQ.data?.tribunais_falhas || [] };

  const atualizar = () => {
    limparCacheAnalises();
    queryClient.resetQueries({ queryKey: ["analise"] });
  };

  const kpis = useMemo(() => {
    const totalVolume = volume.reduce((s, d) => s + (d.count || 0), 0);
    const firstMonth = volume.length ? volume[0].month : "—";
    const lastMonth = volume.length ? volume[volume.length - 1].month : "—";
    const peak = volume.reduce((acc, d) => (d.count > acc.count ? d : acc), { month: "—", count: 0 });
    const totalJG = jusG.reduce((s, d) => s + (d.total || 0), 0);
    const totalMov = jusG.reduce((s, d) => s + (d.comGratuidadeMovimento || 0), 0);
    const totalAssunto = jusG.reduce((s, d) => s + (d.comGratuidadeAssunto || 0), 0);
    const propMediaMov = totalJG ? ((totalMov / totalJG) * 100).toFixed(1) : "0.0";
    const propMediaAssunto = totalJG ? ((totalAssunto / totalJG) * 100).toFixed(1) : "0.0";
    return { totalVolume, firstMonth, lastMonth, peak, propMediaMov, propMediaAssunto };
  }, [volume, jusG]);

  const kpiPronto = volQ.data !== undefined && jgQ.data !== undefined;
  const v = (x) => (kpiPronto ? x : "…");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
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
            <TribunalFilter value={tribunals} onApply={setTribunals} />
            <Button variant="outline" className="gap-2" onClick={atualizar} disabled={carregando}>
              {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Atualizar
            </Button>
          </div>
        </header>

        {meta.falhas.length > 0 && (
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600" />
            <div className="text-muted-foreground">
              {meta.falhas.length} tribunal(is) sem resposta nesta consulta
              ({meta.falhas.map((f) => f.tribunal).join(", ")}). Os demais foram agregados normalmente.
            </div>
          </div>
        )}

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={TrendingUp} label="Total de ações aéreas" value={v(kpis.totalVolume.toLocaleString("pt-BR"))} hint={`${kpis.firstMonth} a ${kpis.lastMonth}`} />
          <MetricCard icon={CalendarRange} label="Mês de pico" value={v(kpis.peak.month)} hint={`${kpis.peak.count.toLocaleString("pt-BR")} ajuizamentos`} />
          <MetricCard icon={Scale} label="% justiça gratuita (média)" value={v(`${kpis.propMediaMov}%`)} hint={`Por movimento (concessão) · assunto ${kpis.propMediaAssunto}%`} accent="text-amber-600" />
          <MetricCard icon={Plane} label="Tribunais consultados" value={v(`${meta.ok.length}`)} hint="Índices respondidos nesta consulta" />
        </section>

        <AnalysisCarousel slides={[
          { titulo: "Volume de ações", nota: notaVolume, conteudo: <Analise consultas={[["fetchAviationVolume", p]]}>{([d]) => <VolumeChart data={d?.serie || []} />}</Analise> },
          { titulo: "Justiça gratuita", nota: notaGratuidade, conteudo: <Analise consultas={[["fetchJusticeGratuita", p]]}>{([d]) => <JusticeGratuitaChart data={d?.serie || []} />}</Analise> },
          {
            titulo: "Tramitação e resultado", nota: notaTramitacao,
            conteudo: <Analise consultas={[["fetchTramitacaoResultado", p]]}>{([d]) => (
              <div className={grid2}><TramitacaoCard tramitacao={d?.tramitacao || null} /><ResultadoCard resultado={d?.resultado || null} /></div>
            )}</Analise>,
          },
          {
            titulo: "Juizado Especial × Justiça Comum", nota: notaRito,
            conteudo: <Analise consultas={[["fetchSegmentacaoJustica", p], ["fetchTramitacaoResultado", { ...p, rito: "JE" }], ["fetchTramitacaoResultado", { ...p, rito: "COMUM" }]]}>{([seg, je, comum]) => (
              <div className="space-y-4">
                <SegmentacaoResumo data={seg?.serie || []} />
                <div className={grid2}><GratuidadeSegmentadaChart data={seg?.serie || []} /><ComparativoRitoCard je={je} comum={comum} /></div>
              </div>
            )}</Analise>,
          },
          { titulo: "Litigância × renda municipal", nota: notaConcentracao, conteudo: <Analise consultas={[["fetchConcentracaoRenda", p]]}>{([d]) => <ConcentracaoRendaChart data={d} />}</Analise> },
          {
            titulo: "Acesso à justiça × passageiros (ANAC)", nota: notaAcesso,
            conteudo: <Analise consultas={[["fetchAcessoPassageiros", p]]}>{([d]) => (
              <div className={grid2}><AcessoPassageirosChart data={d} /><AcessoPassageirosSerie data={d} /></div>
            )}</Analise>,
          },
          { titulo: "Processos parados", nota: notaParados, conteudo: <Analise consultas={[["fetchProcessosParados", p]]}>{([d]) => <ProcessosParadosPerfil data={d} />}</Analise> },
          { titulo: "Lotes no mesmo dia", nota: notaLotes, conteudo: <Analise consultas={[["fetchLotesAjuizamento", p]]}>{([d]) => <LotesChart data={d} />}</Analise> },
          { titulo: "Acordo, execução e baixa", nota: notaIncentivos, conteudo: <Analise consultas={[["fetchIncentivosTribunal", p]]}>{([d]) => <IncentivosTable data={d} />}</Analise> },
          { titulo: "Indícios de litigância predatória", nota: notaPredatoria, conteudo: <Analise consultas={[["fetchLotesAjuizamento", p], ["fetchIncentivosTribunal", p]]}>{([l, i]) => <PredatoriaTable lotes={l} incentivos={i} />}</Analise> },
          {
            titulo: "Tema 1.417 (STF)", nota: notaTema,
            conteudo: <Analise consultas={[["fetchTema1417", p]]}>{([d]) => (
              <div className={grid2}><TemaEventoChart data={d} /><TemaSuspensosPerfil data={d} /></div>
            )}</Analise>,
          },
          {
            titulo: "Tipo de dano e sazonalidade", nota: notaTipoDano,
            conteudo: <Analise consultas={[["fetchTipoDano", p]]}>{([d]) => (
              <div className={grid2}><TipoDanoChart data={d} /><SazonalidadeChart data={d} /></div>
            )}</Analise>,
          },
        ]} />

        <footer className="mt-10 border-t border-border/70 pt-5 text-xs text-muted-foreground space-y-1">
          <p>Fonte: API Pública do DataJud (CNJ). Os resultados de cada análise ficam salvos no navegador por 24 horas; "Atualizar" refaz as consultas.</p>
          <p>
            Nota metodológica geral: todas as análises cobrem ajuizamentos até 31/12/2025; 2026, ano
            incompleto, fica de fora (exceto no estudo de evento do Tema 1.417, que depende dos meses
            após a suspensão). O DataJud reflete a última carga enviada por cada tribunal, e os envios
            ocorrem com atraso variável: os períodos mais recentes tendem a estar subestimados em todas
            as análises. Apenas Tribunais de Justiça estaduais são consultados; os TRFs ficam fora do
            escopo, pois a litigância aérea contra companhias é de competência da Justiça Estadual.
          </p>
          <p>
            Cobertura: Tribunais de Justiça estaduais, incluindo o TJDFT (índice
            <code className="mx-1 rounded bg-muted px-1 py-0.5">api_publica_tjdft</code>).
            O TJRS, de índice mais pesado, é consultado à parte após os demais, com nova
            tentativa em caso de falha, para garantir sua inclusão em todas as cargas.
          </p>
        </footer>
      </div>
    </div>
  );
}