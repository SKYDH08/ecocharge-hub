import { useState, useRef, FormEvent } from "react";
import { Zap, Leaf, Settings, CheckCircle2, Loader2 } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_BASE = "http://127.0.0.1:8000";

interface InvoiceData {
  slot_id: number;
  Initial_Source: string;
  Est_Bill: number;
}

const ChargingTerminal = () => {
  // Vehicle Number State (4 separate boxes)
  const [box1, setBox1] = useState("");
  const [box2, setBox2] = useState("");
  const [box3, setBox3] = useState("");
  const [box4, setBox4] = useState("");

  // Refs for auto-tabbing
  const box2Ref = useRef<HTMLInputElement>(null);
  const box3Ref = useRef<HTMLInputElement>(null);
  const box4Ref = useRef<HTMLInputElement>(null);

  // Charging Mode State
  const [mode, setMode] = useState<"CHARGE_NOW" | "FULL_CHARGE" | "CUSTOM">("CHARGE_NOW");
  const [customKwh, setCustomKwh] = useState(50);

  // UI State
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);

  const vehicleNumber = `${box1}-${box2}-${box3}-${box4}`;
  const isValidVehicle = box1.length === 2 && box2.length === 2 && box3.length === 2 && box4.length === 4;

  const handleBox1Change = (value: string) => {
    const letters = value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
    setBox1(letters);
    if (letters.length === 2) box2Ref.current?.focus();
  };

  const handleBox2Change = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "").slice(0, 2);
    setBox2(numbers);
    if (numbers.length === 2) box3Ref.current?.focus();
  };

  const handleBox3Change = (value: string) => {
    const letters = value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
    setBox3(letters);
    if (letters.length === 2) box4Ref.current?.focus();
  };

  const handleBox4Change = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "").slice(0, 4);
    setBox4(numbers);
  };

  const handleConnect = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidVehicle) {
      toast.error("Please enter a valid vehicle number");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        vehicle_number: vehicleNumber,
        mode: mode,
      };

      if (mode === "CUSTOM") {
        payload.custom_kwh = customKwh;
      }

      const response = await axios.post(`${API_BASE}/connect`, payload);
      setInvoice(response.data);
      toast.success("Vehicle connected successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInvoice(null);
    setBox1("");
    setBox2("");
    setBox3("");
    setBox4("");
    setMode("CHARGE_NOW");
  };

  if (invoice) {
    const isRenewable = invoice.Initial_Source.includes("RENEWABLE");
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-8 animate-fade-in">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-foreground">Connection Authorized</h2>

            <div className="py-8">
              <p className="text-muted-foreground text-sm mb-2">Assigned Slot</p>
              <div className="text-7xl font-bold text-primary">#{invoice.slot_id}</div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Energy Source</span>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  isRenewable ? 'bg-renewable/20 text-renewable pulse-green' : 'bg-conventional/20 text-conventional'
                }`}>
                  {isRenewable ? <Leaf className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  <span className="text-sm font-semibold">
                    {isRenewable ? 'Renewable' : 'Conventional'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Estimated Bill</span>
                <span className="text-2xl font-bold text-foreground">₹{invoice.Est_Bill.toFixed(2)}</span>
              </div>
            </div>

            <Button onClick={handleReset} className="w-full mt-6" size="lg">
              Disconnect & Return
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">EcoCharge AI</h1>
          <p className="text-muted-foreground">Smart Grid Charging Terminal</p>
        </div>

        <form onSubmit={handleConnect} className="space-y-8">
          {/* Vehicle Number Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Vehicle Number
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={box1}
                onChange={(e) => handleBox1Change(e.target.value)}
                className="w-20 h-16 text-center text-2xl font-bold bg-input border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors uppercase"
                placeholder="AA"
                maxLength={2}
              />
              <span className="text-2xl text-muted-foreground">-</span>
              <input
                ref={box2Ref}
                type="text"
                value={box2}
                onChange={(e) => handleBox2Change(e.target.value)}
                className="w-20 h-16 text-center text-2xl font-bold bg-input border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors"
                placeholder="11"
                maxLength={2}
              />
              <span className="text-2xl text-muted-foreground">-</span>
              <input
                ref={box3Ref}
                type="text"
                value={box3}
                onChange={(e) => handleBox3Change(e.target.value)}
                className="w-20 h-16 text-center text-2xl font-bold bg-input border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors uppercase"
                placeholder="AA"
                maxLength={2}
              />
              <span className="text-2xl text-muted-foreground">-</span>
              <input
                ref={box4Ref}
                type="text"
                value={box4}
                onChange={(e) => handleBox4Change(e.target.value)}
                className="w-32 h-16 text-center text-2xl font-bold bg-input border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors"
                placeholder="1234"
                maxLength={4}
              />
              {isValidVehicle && (
                <CheckCircle2 className="w-8 h-8 text-primary animate-scale-in" />
              )}
            </div>
          </div>

          {/* Charging Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-4">
              Select Charging Mode
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setMode("CHARGE_NOW")}
                className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                  mode === "CHARGE_NOW"
                    ? "border-conventional bg-conventional/10"
                    : "border-border bg-card hover:border-conventional/50"
                }`}
              >
                <Zap className={`w-8 h-8 mx-auto mb-3 ${mode === "CHARGE_NOW" ? "text-conventional" : "text-muted-foreground"}`} />
                <h3 className="font-semibold text-foreground mb-1">CHARGE NOW</h3>
                <p className="text-xs text-muted-foreground">Fastest speed. Market Price.</p>
              </button>

              <button
                type="button"
                onClick={() => setMode("FULL_CHARGE")}
                className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                  mode === "FULL_CHARGE"
                    ? "border-renewable bg-renewable/10 glow-green"
                    : "border-border bg-card hover:border-renewable/50"
                }`}
              >
                <Leaf className={`w-8 h-8 mx-auto mb-3 ${mode === "FULL_CHARGE" ? "text-renewable" : "text-muted-foreground"}`} />
                <h3 className="font-semibold text-foreground mb-1">FULL CHARGE</h3>
                <p className="text-xs text-muted-foreground">Optimize Cost. Renewable Energy.</p>
              </button>

              <button
                type="button"
                onClick={() => setMode("CUSTOM")}
                className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                  mode === "CUSTOM"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <Settings className={`w-8 h-8 mx-auto mb-3 ${mode === "CUSTOM" ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="font-semibold text-foreground mb-1">CUSTOM</h3>
                <p className="text-xs text-muted-foreground">Set kWh limit.</p>
              </button>
            </div>

            {mode === "CUSTOM" && (
              <div className="mt-6 p-6 bg-secondary/50 rounded-xl animate-fade-in">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Energy Limit: {customKwh} kWh
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={customKwh}
                  onChange={(e) => setCustomKwh(Number(e.target.value))}
                  className="w-full h-2 bg-input rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>10 kWh</span>
                  <span>100 kWh</span>
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full text-lg"
            disabled={!isValidVehicle || loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Connect & Charge
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChargingTerminal;
