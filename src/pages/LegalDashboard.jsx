import React, { useEffect, useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plane, Scale, CalendarRange, TrendingUp, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { VolumeChart } from "@/components/dashboard/VolumeChart";
import { JusticeGratuitaChart } from "@/components/dashboard/JusticeGratuitaChart";
import { TribunalFilter } from "@/components/dashboard/TribunalFilter";
import { DEFAULT_TRIBUNALS } from "@/lib/tribunals";

export default function LegalDashboard() {
  const [tribunals, setTribunals] = useState(DEFAULT_TRIBUNALS);
  const [volume, setVolume] = useState([]);
  const [jusG, setJusG] = useState([]);
  const [meta, setMeta] = useState({ ok: [], falhas: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (ts) => {
    setLoading(true);
    setError(null);
    try {
      const [volRes, jgRes] = await Promise.all([
        base44.functions.invoke("fetchAviationVolume", { tribunals: ts }),
        base44.functions.invoke("fetchJusticeGratuita", { tribunals: ts }),
      ]);
      setVolume(volRes.data?.serie || []);
      setJusG(jgRes.data?.serie || []);
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
    const totalCom = jusG.reduce((s, d) => s + (d.comGratuidade || 0), 0);
    const propMedia = totalJG ? ((totalCom / totalJG) * 100).toFixed(1) : "0.0";
    return { totalVolume, firstMonth, lastMonth, peak, propMedia };
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
                value={`${kpis.propMedia}%`}
                hint="Proporção ponderada no período"
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
                e "Extravio de bagagem" (filtro por nome, estável nacionalmente). Justiça
                gratuita: presença do assunto "Assistência Judiciária Gratuita" (TPU 10685).
              </p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}