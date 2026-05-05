import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Calculator, DollarSign, TrendingUp, Landmark, 
  Plane, Utensils, Home, BookOpen, ArrowRight,
  TrendingDown, Trophy
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/simulador")({ component: SimuladorPage });

const COLORS = ["#A855F7", "#F97316", "#3B82F6", "#10B981", "#6366F1"];

function SimuladorPage() {
  const [tuition, setTuition] = useState([35000]);
  const [housing, setHousing] = useState([1200]);
  const [food, setFood] = useState([600]);
  const [flight, setFlight] = useState([1500]);
  const [materials, setMaterials] = useState([200]);
  const [usdRate, setUsdRate] = useState(5.45);
  const [duration, setDuration] = useState(4);

  const costs = useMemo(() => {
    const annualTuition = tuition[0];
    const monthlyHousing = housing[0];
    const monthlyFood = food[0];
    const annualFlight = flight[0]; // Assuming 1 round trip per year
    const monthlyMaterials = materials[0];

    const monthlyTotal = monthlyHousing + monthlyFood + monthlyMaterials;
    const annualLiving = monthlyTotal * 12;
    const annualTotal = annualTuition + annualLiving + annualFlight;
    const fullCourseTotal = annualTotal * duration;

    const data = [
      { name: "Mensalidade", value: annualTuition * duration },
      { name: "Moradia", value: monthlyHousing * 12 * duration },
      { name: "Alimentação", value: monthlyFood * 12 * duration },
      { name: "Passagens", value: annualFlight * duration },
      { name: "Material & Extras", value: monthlyMaterials * 12 * duration },
    ];

    return {
      annualTotal,
      fullCourseTotal,
      totalBRL: fullCourseTotal * usdRate,
      chartData: data,
    };
  }, [tuition, housing, food, flight, materials, duration, usdRate]);

  const fmtUSD = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
  const fmtBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Simulador de Custos</h1>
          <p className="text-muted-foreground mt-1 text-sm">Projete o investimento real para o seu intercâmbio</p>
        </div>
        <div className="flex items-center gap-2 bg-sidebar p-2 rounded-xl border border-sidebar-border">
          <DollarSign className="h-4 w-4 text-primary" />
          <Label className="text-xs font-bold whitespace-nowrap">Cotação Dólar:</Label>
          <Input 
            type="number" 
            value={usdRate} 
            onChange={(e) => setUsdRate(Number(e.target.value))}
            className="w-20 h-8 text-xs bg-background border-none text-primary font-bold"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Config Panel */}
        <Card className="lg:col-span-5 p-6 space-y-8 border-sidebar-border bg-sidebar/30 backdrop-blur-xl h-fit">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2 text-sm">
                  <Landmark className="h-4 w-4 text-lilac-500" /> Mensalidade Anual
                </Label>
                <span className="text-sm font-bold text-white">{fmtUSD(tuition[0])}</span>
              </div>
              <Slider value={tuition} onValueChange={setTuition} max={80000} step={500} className="[&_[role=slider]]:bg-lilac-500" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2 text-sm">
                  <Home className="h-4 w-4 text-orange-500" /> Moradia / Mês
                </Label>
                <span className="text-sm font-bold text-white">{fmtUSD(housing[0])}</span>
              </div>
              <Slider value={housing} onValueChange={setHousing} max={3000} step={50} className="[&_[role=slider]]:bg-orange-500" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2 text-sm">
                  <Utensils className="h-4 w-4 text-emerald-500" /> Alimentação / Mês
                </Label>
                <span className="text-sm font-bold text-white">{fmtUSD(food[0])}</span>
              </div>
              <Slider value={food} onValueChange={setFood} max={1500} step={20} className="[&_[role=slider]]:bg-emerald-500" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2 text-sm">
                  <Plane className="h-4 w-4 text-blue-500" /> Passagem (anual)
                </Label>
                <span className="text-sm font-bold text-white">{fmtUSD(flight[0])}</span>
              </div>
              <Slider value={flight} onValueChange={setFlight} min={500} max={5000} step={100} className="[&_[role=slider]]:bg-blue-500" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-indigo-500" /> Material & Extras / Mês
                </Label>
                <span className="text-sm font-bold text-white">{fmtUSD(materials[0])}</span>
              </div>
              <Slider value={materials} onValueChange={setMaterials} max={1000} step={10} className="[&_[role=slider]]:bg-indigo-500" />
            </div>

            <div className="pt-4 border-t border-sidebar-border">
              <Label className="text-xs font-bold uppercase text-muted-foreground mb-3 block">Duração do curso</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((y) => (
                  <Button
                    key={y}
                    variant={duration === y ? "secondary" : "outline"}
                    className={cn("flex-1 h-10", duration === y && "bg-primary text-primary-foreground border-primary")}
                    onClick={() => setDuration(y)}
                  >
                    {y} {y === 1 ? "ano" : "anos"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Results Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6 bg-gradient-to-br from-sidebar to-sidebar-accent border-sidebar-border">
              <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Total em Dólares</p>
              <h2 className="text-4xl font-black text-orange-500">{fmtUSD(costs.fullCourseTotal)}</h2>
              <p className="text-xs text-muted-foreground mt-2">Investimento total por {duration} anos</p>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-sidebar to-sidebar-accent border-sidebar-border">
              <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Total em Reais</p>
              <h2 className="text-4xl font-black text-lilac-500">{fmtBRL(costs.totalBRL)}</h2>
              <p className="text-xs text-muted-foreground mt-2">Baseado na cotação de R$ {usdRate}</p>
            </Card>
          </div>

          <Card className="p-6 border-sidebar-border bg-sidebar/30 backdrop-blur-xl">
            <h3 className="text-lg font-bold mb-6">Distribuição de Gastos</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costs.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {costs.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e1e2d", border: "1px solid #2d2d3f", borderRadius: "8px" }}
                    formatter={(value: number) => fmtUSD(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Trophy className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-400">Dica de Economia</h4>
                <p className="text-sm text-muted-foreground">
                  Você economizaria cerca de <span className="text-emerald-500 font-bold">$12.400</span> optando por moradia compartilhada e cozinhando em casa.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex gap-4 pt-4">
            <Button className="flex-1 h-12 bg-gradient-primary font-bold gap-2">
              Adicionar ao Pipeline <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="flex-1 h-12 border-lilac-500 text-lilac-500 hover:bg-lilac-500 hover:text-white transition-all">
              Simular com outra universidade
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
