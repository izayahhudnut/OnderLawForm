'use client';

import React, { useState, useRef, FormEvent } from "react";
import { FileText, Upload, X, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const missouriCounties = [
  "Adair", "Andrew", "Atchison", "Audrain", "Barry", "Barton", "Bates", "Benton", "Bollinger",
  "Boone", "Buchanan", "Butler", "Caldwell", "Callaway", "Camden", "Cape Girardeau", "Carroll",
  "Carter", "Cass", "Cedar", "Chariton", "Christian", "Clark", "Clay", "Clinton", "Cole", "Cooper",
  "Crawford", "Dade", "Dallas", "Daviess", "DeKalb", "Dent", "Douglas", "Dunklin", "Franklin",
  "Gasconade", "Gentry", "Greene", "Grundy", "Harrison", "Henry", "Hickory", "Hopkins", "Howard",
  "Howell", "Iron", "Jackson", "Jasper", "Jefferson", "Johnson", "Knox", "Laclede", "Lafayette",
  "Lawrence", "Lewis", "Lincoln", "Linn", "Livingston", "McDonald", "Macon", "Madison", "Maries",
  "Marion", "Mercer", "Miller", "Mississippi", "Moniteau", "Monroe", "Montgomery", "Morgan",
  "New Madrid", "Newton", "Nodaway", "Oregon", "Osage", "Ozark", "Pemiscot", "Perry", "Pettis",
  "Phelps", "Pike", "Platte", "Polk", "Pulaski", "Putnam", "Ralls", "Randolph", "Ray", "Reynolds",
  "Ripley", "Saint Charles", "Saint Clair", "Saint Francois", "Saint Genevieve", 
  "Saint Louis City", "Saint Louis County",
  "Saline", "Schuyler", "Scotland", "Scott", "Shannon", "Shelby", "Stoddard", "Stone", "Sullivan",
  "Taney", "Texas", "Vernon", "Warren", "Washington", "Wayne", "Webster", "Worth", "Wright"
];

export default function Form() {
  const formRef = useRef<HTMLFormElement>(null);
  const [activeTab, setActiveTab] = useState("client");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data state to persist values between tabs
  const [formData, setFormData] = useState({
    // Client info
    insuredName: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    county: "",
    policyNumber: "",
    claimNumber: "",
    dateOfLoss: "",
    
    // Insurance info
    insuranceCompany: "",
    insuranceStreetAddress: "",
    insuranceCity: "",
    insuranceState: "",
    insuranceZipCode: "",
  });
  
  // Handle input changes to keep state in sync
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Function to trim all input values
  const trimAllValues = (data: typeof formData) => {
    const trimmed = { ...data };
    Object.keys(trimmed).forEach(key => {
      if (typeof trimmed[key as keyof typeof trimmed] === 'string') {
        trimmed[key as keyof typeof trimmed] = (trimmed[key as keyof typeof trimmed] as string).trim();
      }
    });
    return trimmed;
  };
  
  const [files, setFiles] = useState({
    aobContract: null as File | null,
    damagePicture: null as File | null,
    denial: null as File | null,
    hoverReport1: null as File | null,
    itelReport: null as File | null,
    insuranceEstimate: null as File | null,
    hisHersEstimate: null as File | null,
    correspondent: null as File | null
  });

  const handleFileChange = (name: keyof typeof files, file: File | null) => {
    setFiles(prev => ({ ...prev, [name]: file }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create a new FormData object
      const submitFormData = new FormData();
      
      // Trim all form values and add them to the form data
      const trimmedData = trimAllValues(formData);
      
      // Add all form fields from our trimmed state, with special handling for county
      Object.entries(trimmedData).forEach(([name, value]) => {
        if (name === 'county' && value === 'Saint Louis County') {
          // For Saint Louis County, send just "Saint Louis" to Zapier
          submitFormData.append(name, 'Saint Louis');
        } else {
          submitFormData.append(name, value);
        }
      });
      
      // Append all files - only include files that have content
      Object.entries(files).forEach(([name, file]) => {
        if (file && file.size > 0) {
          submitFormData.append(name, file);
        }
        // Skip empty files completely to avoid formidable errors
      });

      console.log('Submitting form...');
      const response = await fetch('/api/county', {
        method: 'POST',
        body: submitFormData,
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = { error: 'Could not parse server response' };
      }
      
      if (!response.ok) {
        console.error('Server returned error:', responseData);
        throw new Error(responseData.error || 'Submission failed');
      }
      
      console.log('Form submitted successfully:', responseData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      
      // Reset form state
      setFormData({
        insuredName: "",
        streetAddress: "",
        city: "",
        state: "",
        zipCode: "",
        county: "",
        policyNumber: "",
        claimNumber: "",
        dateOfLoss: "",
        insuranceCompany: "",
        insuranceStreetAddress: "",
        insuranceCity: "",
        insuranceState: "",
        insuranceZipCode: "",
      });
      
      // Clear files
      setFiles({
        aobContract: null,
        damagePicture: null,
        denial: null,
        hoverReport1: null,
        itelReport: null,
        insuranceEstimate: null,
        hisHersEstimate: null,
        correspondent: null
      });
      
      // Reset form ref
      if (formRef.current) {
        formRef.current.reset();
      }
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUploadField = ({
    name,
    label,
    required = false,
    file,
    onChange,
  }: {
    name: string;
    label: string;
    required?: boolean;
    file: File | null;
    onChange: (file: File | null) => void;
  }) => {
    return (
      <div className="space-y-2">
        <Label htmlFor={name} className="text-sm font-medium">
          {label} {required && <span className="text-black">*</span>}
          {!required && <span className="text-sm font-normal text-gray-500 ml-2">(Optional)</span>}
        </Label>
        
        <div className={`w-full rounded-md border border-dashed p-4 ${file ? 'bg-white border-black' : 'border-gray-300'}`}>
          {!file ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Upload className="h-8 w-8 text-black mb-2" />
              <Label htmlFor={name} className="text-sm cursor-pointer text-black hover:text-gray-700 font-medium">
                Choose a file
                <Input
                  id={name}
                  name={name}
                  type="file"
                  className="sr-only"
                  onChange={(e) => onChange(e.target.files?.[0] || null)}
                  required={required}
                  noInfoButton
                />
              </Label>
              <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG up to 10MB</p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-black" />
                <div>
                  <p className="text-sm font-medium text-black">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  onChange(null);
                }}
                className="h-8 w-8 rounded-full hover:bg-gray-200"
              >
                <X className="h-4 w-4 text-black" />
              </Button>
            </div>
          )}
        </div>
      </div>
  );
};

const goToNextTab = () => {
  if (activeTab === "client") setActiveTab("insurance");
  else if (activeTab === "insurance") setActiveTab("documents");
};

return (
  <div className="min-h-screen bg-white p-4 md:p-8">
    {showSuccess && (
      <div className="fixed top-4 right-4 z-50">
        <Alert className="bg-white border border-gray-300">
          <CheckCircle className="h-4 w-4 text-black" />
          <AlertTitle className="text-black">Success</AlertTitle>
          <AlertDescription className="text-gray-700">
            Your complaint form has been submitted successfully.
          </AlertDescription>
        </Alert>
      </div>
    )}

    <Card className="max-w-4xl mx-auto shadow-lg bg-white">
      <CardHeader className="bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-black" />
          <CardTitle className="text-black">AOB Complaint Form</CardTitle>
        </div>
        <CardDescription className="text-gray-700">
          Please complete all required fields for your Assignment of Benefits complaint
        </CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 pt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="client">Client Info</TabsTrigger>
            <TabsTrigger value="insurance">Insurance Info</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
        </div>

        <form ref={formRef} onSubmit={handleSubmit}>
          <CardContent className="p-6">
            {/* Client Information */}
            <TabsContent value="client" className="space-y-6 mt-0">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="insuredName">Insured&apos;s Name *</Label>
                  <Input
                    id="insuredName"
                    name="insuredName"
                    value={formData.insuredName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Address of Insured *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input 
                      name="streetAddress" 
                      placeholder="Street Address" 
                      value={formData.streetAddress}
                      onChange={handleInputChange}
                      required 
                    />
                    <Input 
                      name="city" 
                      placeholder="City" 
                      value={formData.city}
                      onChange={handleInputChange}
                      required 
                    />
                    <Input 
                      name="state" 
                      placeholder="State" 
                      value={formData.state}
                      onChange={handleInputChange}
                      required 
                    />
                    <Input 
                      name="zipCode" 
                      placeholder="Zip Code" 
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="county">County of Insured *</Label>
                    <select
                      id="county"
                      name="county"
                      value={formData.county}
                      onChange={(e) => {
                        // For displaying purposes in the UI, we store what the user selected
                        // But for submission to Zapier, we'll convert it if needed
                        handleInputChange(e);
                      }}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                    >
                      <option value="">Select County</option>
                      {missouriCounties.map(county => (
                        <option key={county} value={county}>{county}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="policyNumber">Policy Number *</Label>
                    <Input 
                      name="policyNumber" 
                      value={formData.policyNumber}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="claimNumber">Claim Number *</Label>
                    <Input 
                      name="claimNumber" 
                      value={formData.claimNumber}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfLoss">Date of Loss *</Label>
                    <Input 
                      name="dateOfLoss" 
                      type="date" 
                      value={formData.dateOfLoss}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Insurance Information */}
            <TabsContent value="insurance" className="space-y-6 mt-0">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="insuranceCompany">Insurance Company Name *</Label>
                  <Input 
                    name="insuranceCompany"
                    value={formData.insuranceCompany}
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Insurance Company Address *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input 
                      name="insuranceStreetAddress" 
                      placeholder="Street Address" 
                      value={formData.insuranceStreetAddress}
                      onChange={handleInputChange}
                      required 
                    />
                    <Input 
                      name="insuranceCity" 
                      placeholder="City" 
                      value={formData.insuranceCity}
                      onChange={handleInputChange}
                      required 
                    />
                    <Input 
                      name="insuranceState" 
                      placeholder="State" 
                      value={formData.insuranceState}
                      onChange={handleInputChange}
                      required 
                    />
                    <Input 
                      name="insuranceZipCode" 
                      placeholder="Zip Code" 
                      value={formData.insuranceZipCode}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUploadField
                  name="aobContract"
                  label="AOB Contract"
                  required
                  file={files.aobContract}
                  onChange={(file) => handleFileChange('aobContract', file)}
                />
                <FileUploadField
                  name="damagePicture"
                  label="Picture of Damage"
                  file={files.damagePicture}
                  onChange={(file) => handleFileChange('damagePicture', file)}
                />
                <FileUploadField
                  name="denial"
                  label="Denial Document"
                  file={files.denial}
                  onChange={(file) => handleFileChange('denial', file)}
                />
                <FileUploadField
                  name="hoverReport1"
                  label="Hover Report"
                  file={files.hoverReport1}
                  onChange={(file) => handleFileChange('hoverReport1', file)}
                />
                <FileUploadField
                  name="itelReport"
                  label="ITEL Report"
                  file={files.itelReport}
                  onChange={(file) => handleFileChange('itelReport', file)}
                />
                <FileUploadField
                  name="insuranceEstimate"
                  label="Insurance Estimate"
                  file={files.insuranceEstimate}
                  onChange={(file) => handleFileChange('insuranceEstimate', file)}
                />
                <FileUploadField
                  name="hisHersEstimate"
                  label="His & Hers Estimate"
                  file={files.hisHersEstimate}
                  onChange={(file) => handleFileChange('hisHersEstimate', file)}
                />
                <FileUploadField
                  name="correspondent"
                  label="Correspondent"
                  file={files.correspondent}
                  onChange={(file) => handleFileChange('correspondent', file)}
                />
              </div>
            </TabsContent>
          </CardContent>

          <CardFooter className="border-t p-6 bg-white flex justify-between">
            <div className="text-sm text-gray-700">
              <p>All fields marked with <span className="text-black">*</span> are required</p>
            </div>
            {activeTab !== "documents" ? (
              <Button type="button" onClick={goToNextTab} className="bg-black hover:bg-gray-800 text-white">
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="bg-black hover:bg-gray-800 text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Complaint</span>
                )}
              </Button>
            )}
          </CardFooter>
        </form>
      </Tabs>
    </Card>
  </div>
);
}