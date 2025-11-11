import { Card } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";

interface Customer {
  id: string;
  name: string;
  email: string;
  recency: number;
  frequency: number;
  monetary: number;
  rfmScore: string;
  segment: string;
  lastPurchase: string;
  totalSpent: number;
}

const customers: Customer[] = [
  { id: "1", name: "Sarah Johnson", email: "sarah.j@email.com", recency: 5, frequency: 5, monetary: 5, rfmScore: "555", segment: "Champions", lastPurchase: "2 days ago", totalSpent: 4850 },
  { id: "2", name: "Michael Chen", email: "m.chen@email.com", recency: 5, frequency: 4, monetary: 5, rfmScore: "545", segment: "Champions", lastPurchase: "3 days ago", totalSpent: 3920 },
  { id: "3", name: "Emily Davis", email: "emily.d@email.com", recency: 4, frequency: 5, monetary: 4, rfmScore: "454", segment: "Loyal Customers", lastPurchase: "8 days ago", totalSpent: 3450 },
  { id: "4", name: "James Wilson", email: "j.wilson@email.com", recency: 2, frequency: 5, monetary: 4, rfmScore: "254", segment: "At Risk", lastPurchase: "45 days ago", totalSpent: 2890 },
  { id: "5", name: "Lisa Anderson", email: "l.anderson@email.com", recency: 5, frequency: 2, monetary: 3, rfmScore: "523", segment: "Potential Loyalists", lastPurchase: "4 days ago", totalSpent: 1560 },
  { id: "6", name: "Robert Taylor", email: "r.taylor@email.com", recency: 1, frequency: 4, monetary: 3, rfmScore: "143", segment: "Can't Lose Them", lastPurchase: "89 days ago", totalSpent: 2340 },
  { id: "7", name: "Jennifer Lee", email: "jen.lee@email.com", recency: 5, frequency: 1, monetary: 2, rfmScore: "512", segment: "New Customers", lastPurchase: "1 day ago", totalSpent: 450 },
  { id: "8", name: "David Martinez", email: "d.martinez@email.com", recency: 3, frequency: 3, monetary: 3, rfmScore: "333", segment: "Need Attention", lastPurchase: "22 days ago", totalSpent: 1890 },
  { id: "9", name: "Amanda White", email: "a.white@email.com", recency: 1, frequency: 1, monetary: 1, rfmScore: "111", segment: "Hibernating", lastPurchase: "120 days ago", totalSpent: 230 },
  { id: "10", name: "Chris Brown", email: "c.brown@email.com", recency: 4, frequency: 4, monetary: 4, rfmScore: "444", segment: "Loyal Customers", lastPurchase: "7 days ago", totalSpent: 3120 },
];

const segmentColors: Record<string, string> = {
  "Champions": "bg-green-100 text-green-800",
  "Loyal Customers": "bg-blue-100 text-blue-800",
  "Potential Loyalists": "bg-indigo-100 text-indigo-800",
  "New Customers": "bg-purple-100 text-purple-800",
  "Promising": "bg-cyan-100 text-cyan-800",
  "Need Attention": "bg-yellow-100 text-yellow-800",
  "At Risk": "bg-orange-100 text-orange-800",
  "Can't Lose Them": "bg-red-100 text-red-800",
  "Hibernating": "bg-gray-100 text-gray-800",
};

export function CustomerSegmentTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSegment, setFilterSegment] = useState("all");

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = filterSegment === "all" || customer.segment === filterSegment;
    return matchesSearch && matchesSegment;
  });

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="mb-4">Customer Details by Segment</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={filterSegment} onValueChange={setFilterSegment}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              <SelectItem value="Champions">Champions</SelectItem>
              <SelectItem value="Loyal Customers">Loyal Customers</SelectItem>
              <SelectItem value="At Risk">At Risk</SelectItem>
              <SelectItem value="Can't Lose Them">Can't Lose Them</SelectItem>
              <SelectItem value="Hibernating">Hibernating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead className="text-center">R</TableHead>
              <TableHead className="text-center">F</TableHead>
              <TableHead className="text-center">M</TableHead>
              <TableHead className="text-center">RFM Score</TableHead>
              <TableHead>Last Purchase</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div>
                    <div>{customer.name}</div>
                    <div className="text-sm text-gray-500">{customer.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={segmentColors[customer.segment]}>
                    {customer.segment}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{customer.recency}</TableCell>
                <TableCell className="text-center">{customer.frequency}</TableCell>
                <TableCell className="text-center">{customer.monetary}</TableCell>
                <TableCell className="text-center">{customer.rfmScore}</TableCell>
                <TableCell>{customer.lastPurchase}</TableCell>
                <TableCell className="text-right">${customer.totalSpent.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
