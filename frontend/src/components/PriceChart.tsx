"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { fetchHistoricalPrices } from "@/services/market";
import { formatCurrency } from "@/utils/formatters";

interface PriceChartProps {
  assetAddress: string;
}

type TimeframeOption = "day" | "week" | "month" | "year";

interface ChartDataPoint {
  time: string;
  price: number;
}

export default function PriceChart({ assetAddress }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<TimeframeOption>("day");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load historical price data
  useEffect(() => {
    const loadChartData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchHistoricalPrices(assetAddress, timeframe);
        setChartData(data);
      } catch (error) {
        console.error("Error loading chart data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChartData();
  }, [assetAddress, timeframe]);

  // Format X-axis ticks based on timeframe
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);

    if (timeframe === "day") {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (timeframe === "week") {
      return date.toLocaleDateString([], { weekday: "short" });
    } else if (timeframe === "month") {
      return date.toLocaleDateString([], { day: "numeric", month: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short" });
    }
  };

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="text-xs text-gray-500">
            {new Date(label).toLocaleString()}
          </p>
          <p className="text-sm font-medium text-indigo-600">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Timeframe selector */}
      <div className="flex mb-4 space-x-1">
        {(["day", "week", "month", "year"] as TimeframeOption[]).map(
          (option) => (
            <button
              key={option}
              onClick={() => setTimeframe(option)}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                timeframe === option
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Chart */}
      <div className="h-80">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <span className="ml-2 text-sm text-gray-500">
              Loading chart data...
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis
                dataKey="time"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
                stroke="#9CA3AF"
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value, "USD", 0)}
                stroke="#9CA3AF"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#4F46E5"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
