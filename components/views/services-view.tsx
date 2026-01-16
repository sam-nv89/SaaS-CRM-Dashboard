"use client"

import { useState } from "react"
import { Edit2, Clock, DollarSign, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { EditServiceDialog } from "@/components/dialogs/edit-service-dialog"

interface Service {
  id: string
  name: string
  duration: string
  price: number
  active: boolean
}

interface ServiceCategory {
  id: string
  name: string
  services: Service[]
}

const initialCategories: ServiceCategory[] = [
  {
    id: "hair",
    name: "Hair",
    services: [
      { id: "1", name: "Haircut", duration: "45 min", price: 45, active: true },
      { id: "2", name: "Hair Coloring", duration: "2h", price: 120, active: true },
      { id: "3", name: "Balayage", duration: "2.5h", price: 180, active: true },
      { id: "4", name: "Hair Treatment", duration: "1h", price: 65, active: false },
    ],
  },
  {
    id: "nails",
    name: "Nails",
    services: [
      { id: "5", name: "Manicure", duration: "45 min", price: 35, active: true },
      { id: "6", name: "Pedicure", duration: "1h", price: 45, active: true },
      { id: "7", name: "Gel Nails", duration: "1.5h", price: 55, active: true },
    ],
  },
  {
    id: "beauty",
    name: "Beauty",
    services: [
      { id: "8", name: "Facial", duration: "1h", price: 80, active: true },
      { id: "9", name: "Eyebrow Shaping", duration: "30 min", price: 25, active: true },
      { id: "10", name: "Lash Extensions", duration: "2h", price: 150, active: false },
    ],
  },
  {
    id: "men",
    name: "Men's Grooming",
    services: [
      { id: "11", name: "Men's Haircut", duration: "30 min", price: 30, active: true },
      { id: "12", name: "Beard Trim", duration: "20 min", price: 20, active: true },
      { id: "13", name: "Hot Towel Shave", duration: "45 min", price: 40, active: true },
    ],
  },
]

export function ServicesView() {
  const [categories, setCategories] = useState(initialCategories)
  const [openCategories, setOpenCategories] = useState<string[]>(["hair", "nails"])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const toggleServiceActive = (categoryId: string, serviceId: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              services: cat.services.map((svc) => (svc.id === serviceId ? { ...svc, active: !svc.active } : svc)),
            }
          : cat,
      ),
    )
  }

  const handleEditService = (service: Service) => {
    setEditingService(service)
    setEditDialogOpen(true)
  }

  const handleServiceUpdated = (updatedService: Service) => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        services: cat.services.map((svc) => (svc.id === updatedService.id ? updatedService : svc)),
      })),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Services</h2>
        <Button
          size="sm"
          variant="outline"
          className="border-primary text-primary bg-transparent hover:bg-primary/5 transition-colors"
        >
          Add Service
        </Button>
      </div>

      {/* Service Categories */}
      <div className="space-y-3">
        {categories.map((category) => (
          <Collapsible
            key={category.id}
            open={openCategories.includes(category.id)}
            onOpenChange={() => toggleCategory(category.id)}
          >
            <Card className="border-border bg-card overflow-hidden shadow-sm">
              <CollapsibleTrigger asChild>
                <CardContent className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{category.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {category.services.filter((s) => s.active).length} of {category.services.length} active
                      </p>
                    </div>
                    {openCategories.includes(category.id) ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t border-border divide-y divide-border">
                  {category.services.map((service) => (
                    <div
                      key={service.id}
                      className={`p-4 flex items-center justify-between transition-colors hover:bg-secondary/30 ${!service.active ? "opacity-50" : ""}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{service.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {service.duration}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <DollarSign className="h-3 w-3" />
                            {service.price}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={service.active}
                          onCheckedChange={() => toggleServiceActive(category.id, service.id)}
                          className="data-[state=checked]:bg-confirmed"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-secondary transition-colors"
                          onClick={() => handleEditService(service)}
                        >
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      <EditServiceDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        service={editingService}
        onServiceUpdated={handleServiceUpdated}
      />
    </div>
  )
}
