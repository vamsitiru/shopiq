import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// ---------- OpenTelemetry Setup ----------

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.JAEGER_AGENT_URL,
  }),
  serviceName: process.env.JAEGER_SERVICE_NAME || 'shopiq_service',
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0));
});