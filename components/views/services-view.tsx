"use client"

import { useState, useEffect } from "react"
import { Edit2, Clock, DollarSign, ChevronDown, ChevronUp, Loader2, Trash2, Settings, Check, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { EditServiceDialog } from "@/components/dialogs/edit-service-dialog"
import { AddServiceDialog } from "@/components/dialogs/add-service-dialog"
import { getServices, updateService, renameCategory, deleteCategory } from "@/lib/db"
import type { Service } from "@/types/database"
import { toast } from "sonner"

interface ServiceCategory {
  id: string
  name: string
  services: Service[]
}

export function ServicesView() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [openCategories, setOpenCategories] = useState<string[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Category management state
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isAddingCategory, setIsAddingCategory] = useState(false)

  // Load services from Supabase on mount
  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setIsLoading(true)
      const services = await getServices()

      // Group services by category
      const grouped = services.reduce((acc, service) => {
        const category = service.category || 'Other'
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(service)
        return acc
      }, {} as Record<string, Service[]>)

      const categoryList: ServiceCategory[] = Object.entries(grouped).map(([name, services]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        services,
      }))

      setCategories(categoryList)
      // Open first two categories by default
      setOpenCategories(categoryList.slice(0, 2).map(c => c.id))
    } catch (error) {
      console.error('Error loading services:', error)
      toast.error('Failed to load services')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const toggleServiceActive = async (categoryId: string, serviceId: string) => {
    // Optimistic update
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

    // Find the service and update in Supabase
    const category = categories.find(c => c.id === categoryId)
    const service = category?.services.find(s => s.id === serviceId)
    if (service) {
      try {
        await updateService({ id: serviceId, active: !service.active })
      } catch (error) {
        console.error('Error updating service:', error)
        toast.error('Failed to update service')
        // Revert on error
        loadServices()
      }
    }
  }

  const handleEditService = (service: Service) => {
    setEditingService(service)
    setEditDialogOpen(true)
  }

  const handleServiceUpdated = async (updatedService: Service) => {
    try {
      await updateService({
        id: updatedService.id,
        price: updatedService.price,
        duration: updatedService.duration,
      })

      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          services: cat.services.map((svc) => (svc.id === updatedService.id ? updatedService : svc)),
        })),
      )
      toast.success("Service updated!")
    } catch (error) {
      console.error('Error updating service:', error)
      toast.error('Failed to update service')
    }
  }

  const handleRenameCategory = async (category: ServiceCategory) => {
    if (!editingCategoryName.trim() || editingCategoryName === category.name) {
      setEditingCategoryId(null)
      return
    }
    try {
      await renameCategory(category.name, editingCategoryName.trim())
      await loadServices()
      setEditingCategoryId(null)
      toast.success(`Category renamed to "${editingCategoryName.trim()}"`)
    } catch (error) {
      console.error('Error renaming category:', error)
      toast.error('Failed to rename category')
    }
  }

  const handleDeleteCategory = async (category: ServiceCategory) => {
    if (!confirm(`Delete category "${category.name}"? Services will be moved to "Other".`)) return
    try {
      await deleteCategory(category.name)
      await loadServices()
      toast.success(`Category "${category.name}" deleted`)
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
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
          onClick={() => setAddDialogOpen(true)}
        >
          Add Service
        </Button>
      </div>

      {/* Manage Categories - Collapsible */}
      <Collapsible open={manageCategoriesOpen} onOpenChange={setManageCategoriesOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2">
            <Settings className="h-4 w-4" />
            Manage Categories
            {manageCategoriesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Card className="border-border bg-card">
            <CardContent className="p-3 space-y-2">
              {/* Add new category */}
              {isAddingCategory ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="h-8 flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newCategoryName.trim()) {
                        // Create empty service to establish category
                        toast.info(`Create a service in "${newCategoryName}" to add this category`)
                        setIsAddingCategory(false)
                        setNewCategoryName("")
                      }
                    }}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                    if (newCategoryName.trim()) {
                      toast.info(`Create a service in "${newCategoryName}" to add this category`)
                    }
                    setIsAddingCategory(false)
                    setNewCategoryName("")
                  }}>
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                    setIsAddingCategory(false)
                    setNewCategoryName("")
                  }}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground"
                  onClick={() => setIsAddingCategory(true)}
                >
                  + Add Category
                </Button>
              )}

              {/* Existing categories */}
              {categories.map((category) => (
                <div key={category.id} className="flex items-center gap-2">
                  {editingCategoryId === category.id ? (
                    <>
                      <Input
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        className="h-8 flex-1"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameCategory(category)}
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRenameCategory(category)}>
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingCategoryId(null)}>
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{category.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingCategoryId(category.id)
                          setEditingCategoryName(category.name)
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleDeleteCategory(category)}
                        disabled={category.name === 'Other'}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
              {categories.length === 0 && !isAddingCategory && (
                <p className="text-sm text-muted-foreground text-center py-2">No categories yet</p>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

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

      <AddServiceDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onServiceCreated={(service) => {
          // Add to categories or create new category
          setCategories((prev) => {
            const categoryId = service.category.toLowerCase().replace(/\s+/g, '-')
            const existingCategory = prev.find((c) => c.id === categoryId)

            if (existingCategory) {
              return prev.map((cat) =>
                cat.id === categoryId
                  ? { ...cat, services: [...cat.services, service] }
                  : cat
              )
            } else {
              return [
                ...prev,
                {
                  id: categoryId,
                  name: service.category,
                  services: [service],
                }
              ]
            }
          })
          // Open the new category if it was collapsed
          setOpenCategories((prev) => {
            const categoryId = service.category.toLowerCase().replace(/\s+/g, '-')
            if (!prev.includes(categoryId)) {
              return [...prev, categoryId]
            }
            return prev
          })
        }}
        existingCategories={categories.map((c) => c.name)}
      />
    </div>
  )
}
