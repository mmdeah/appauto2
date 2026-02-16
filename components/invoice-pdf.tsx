import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { ServiceOrder, Client, Vehicle, QuotationItem } from "@/lib/types"
import { formatCurrency } from "@/lib/utils-service"

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: "1pt solid #e5e5e5",
    paddingBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "left",
    color: "#1a1a1a",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1a1a1a",
    borderBottom: "1pt solid #e5e5e5",
    paddingBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: "35%",
    fontWeight: "500",
    color: "#1a1a1a",
  },
  value: {
    width: "65%",
    color: "#4a4a4a",
    fontSize: 10,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "transparent",
    padding: 8,
    fontWeight: "600",
    borderBottom: "2pt solid #1a1a1a",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottom: "1pt solid #f0f0f0",
  },
  col1: { width: "10%" },
  col2: { width: "50%" },
  col3: { width: "10%" },
  col4: { width: "15%" },
  col5: { width: "15%", textAlign: "right" },
  totals: {
    marginTop: 20,
    paddingTop: 12,
    borderTop: "2pt solid #1a1a1a",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
  },
  totalLabel: {
    width: 90,
    textAlign: "right",
    marginRight: 12,
    fontWeight: "500",
    color: "#666",
  },
  totalValue: {
    width: 110,
    textAlign: "right",
    fontWeight: "500",
    color: "#1a1a1a",
  },
  grandTotal: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#999",
    fontSize: 7,
    borderTop: "1pt solid #e5e5e5",
    paddingTop: 10,
  },
})

interface InvoicePDFProps {
  order: ServiceOrder
  client: Client
  vehicle: Vehicle
  documentType?: "quotation" | "invoice"
}

export const InvoicePDF = ({ order, client, vehicle, documentType }: InvoicePDFProps) => {
  const subtotal = order.quotation?.items.reduce((sum, item) => sum + item.total, 0) || 0
  const iva = order.quotation?.includeIVA ? subtotal * 0.19 : 0
  const total = subtotal + iva

  // Determinar el tipo de documento
  // Si se especifica documentType, usarlo; de lo contrario, determinar por el estado
  let documentTitle: string
  if (documentType === "quotation") {
    documentTitle = "COTIZACIÓN"
  } else if (documentType === "invoice") {
    documentTitle = "CUENTA DE COBRO"
  } else {
    // Si no se especifica, determinar por el estado
    documentTitle = order.state === "quotation" 
      ? "COTIZACIÓN" 
      : "CUENTA DE COBRO"
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{documentTitle}</Text>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la Orden</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Número de Orden:</Text>
            <Text style={styles.value}>{order.orderNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de Ingreso:</Text>
            <Text style={styles.value}>{new Date(order.intakeDate).toLocaleDateString("es-CO")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Estado:</Text>
            <Text style={styles.value}>{order.state}</Text>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{client.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Cédula:</Text>
            <Text style={styles.value}>{client.idNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Teléfono:</Text>
            <Text style={styles.value}>{client.phone}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{client.email}</Text>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Vehículo</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Placa:</Text>
            <Text style={styles.value}>{vehicle.licensePlate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Marca:</Text>
            <Text style={styles.value}>{vehicle.make}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Modelo:</Text>
            <Text style={styles.value}>{vehicle.model}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Año:</Text>
            <Text style={styles.value}>{vehicle.year}</Text>
          </View>
        </View>

        {/* Services Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle de Servicios</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>#</Text>
              <Text style={styles.col2}>Descripción</Text>
              <Text style={styles.col3}>Cant.</Text>
              <Text style={styles.col4}>Precio Unit.</Text>
              <Text style={styles.col5}>Total</Text>
            </View>
            {order.quotation?.items.map((item: QuotationItem, index: number) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.col1}>{index + 1}</Text>
                <Text style={styles.col2}>{item.description}</Text>
                <Text style={styles.col3}>{item.quantity}</Text>
                <Text style={styles.col4}>{formatCurrency(item.unitPrice)}</Text>
                <Text style={styles.col5}>{formatCurrency(item.total)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          {order.quotation?.includeIVA && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IVA (19%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(iva)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.grandTotal]}>Total:</Text>
            <Text style={[styles.totalValue, styles.grandTotal]}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Gracias por confiar en nuestros servicios</Text>
          <Text>Este documento es una cuenta de cobro y no constituye factura electrónica</Text>
        </View>
      </Page>
    </Document>
  )
}
