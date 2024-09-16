import * as React from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  FormSelectOption,
  ActionGroup,
  Button,
  HelperText,
  HelperTextItem,
  FormHelperText,
  FormSelect,
  Page,
  PageSection,
  Title,
  Radio,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import Helmet from 'react-helmet';
import {
  useK8sWatchResource, useK8sModel, getGroupVersionKindForResource, ResourceYAMLEditor
} from '@openshift-console/dynamic-plugin-sdk';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';

import './kuadrant.css';
import { handleCreate } from '../utils/createResource';
// import { handleCancel } from '../utils/cancel';

import { useHistory, Link } from 'react-router-dom';
import NamespaceSelect from './namespace/NamespaceSelect';
import yaml from 'js-yaml';



const KuadrantTLSPage: React.FC = () => {

  const history = useHistory();


  const [policyName, setPolicyName] = React.useState('');
  const [selectedNamespace, setSelectedNamespace] = React.useState("");
  const [selectedGateway, setSelectedGateway] = React.useState("");
  const [gateways, setGateways] = React.useState([]);
  const [certIssuers, setCertIssuers] = React.useState([]);
  const [selectedCertIssuer, setSelectedCertIssuer] = React.useState("");

  const skeletonTls = () => ({
    apiVersion: 'kuadrant.io/v1alpha1',
    kind: 'TLSPolicy',
    metadata: {
      name: '',
      namespace: '',
    },
    spec: {
      targetRef: {
        group: 'gateway.networking.k8s.io',
        kind: 'Gateway',
        name: '',
      },
      issuerRef: {
        name: selectedCertIssuer,
        kind: '',
      },
    },
  })

  const createTlsPolicy = () => ( {
    apiVersion: 'kuadrant.io/v1alpha1',
    kind: 'TLSPolicy',
    metadata: {
      name: policyName,
      namespace: selectedNamespace,
    },
    spec: {
      targetRef: {
        group: 'gateway.networking.k8s.io',
        kind: 'Gateway',
        name: selectedGateway,
      },
      issuerRef: {
        name: selectedCertIssuer,
        kind: 'ClusterIssuer',
      },
    },
  })


  const tlsPolicy = createTlsPolicy();
  const [yamlInput, setYamlInput] = React.useState(yaml.dump(skeletonTls()));

  const handleYAMLChange = (yamlStr) => {
    try {
      const parsedYaml = yaml.load(yamlStr);  
      setPolicyName(parsedYaml.metadata?.name || '');
      setSelectedNamespace(parsedYaml.metadata?.namespace || '');
      setSelectedGateway(parsedYaml.spec?.targetRef?.name || '');
      setSelectedCertIssuer(parsedYaml.spec?.issuerRef?.name || '');
      setValidatedName(parsedYaml.metadata?.name ? 'success' : 'error');
      setYamlInput(yamlStr);  
    } catch (e) {
      console.error('Error parsing YAML:', e);
      setValidatedName('error');  
    }
  };

  type validate = 'success' | 'default' | 'error';
  const [validatedName, setValidatedName] = React.useState<validate>('default');
  const [validatedGateway, setValidatedGateway] = React.useState<validate>('default');
  const [validatedCertIssuer, setValidatedCertIssuer] = React.useState<validate>('default');



  const handleNameChange = (_event, policyName: string) => {
    if (policyName.trim() !== "") {
      setPolicyName(policyName);
      setValidatedName('success');
      console.log("success check")
    } else {
      setValidatedName('error');
      console.log("error check")

    }
  };

  React.useEffect(() => {
    const updatedTLSState = createTlsPolicy();
    setYamlInput(yaml.dump(updatedTLSState));
  }, [policyName, selectedNamespace, selectedGateway, selectedCertIssuer]);


  const [view, setView] = React.useState('form');



  const tlsPolicyGVK = getGroupVersionKindForResource({ apiVersion: 'kuadrant.io/v1alpha1', kind: 'TLSPolicy' });
  const [tlsPolicyModel] = useK8sModel({ group: tlsPolicyGVK.group, version: tlsPolicyGVK.version, kind: tlsPolicyGVK.kind });

  const gatewayResource = {
    groupVersionKind: { group: 'gateway.networking.k8s.io', version: 'v1', kind: 'Gateway' },
    isList: true
  };

  const [gatewayData, gatewayLoaded, gatewayError] = useK8sWatchResource(gatewayResource);
  React.useEffect(() => {

    if (gatewayLoaded && !gatewayError && Array.isArray(gatewayData)) {
      setGateways(gatewayData.map((ns) => ns.metadata.name));
    }
  }, [gatewayData, gatewayLoaded, gatewayError]);

  const handleGatewayChange = (event) => {
    if (event.currentTarget.value.trim() !== "") { 
      setSelectedGateway(event.currentTarget.value); 
      setValidatedGateway('success');
      console.log("success check")
    } else {
      setValidatedGateway('error');
      console.log("error check")

    }
  };


  const certIssuerResource = {
    groupVersionKind: { group: 'cert-manager.io', version: 'v1', kind: 'ClusterIssuer' },
    isList: true
  };
  const [certIssuerData, certIssuerLoaded, certIssuerError] = useK8sWatchResource(certIssuerResource);
  React.useEffect(() => {

    if (certIssuerLoaded && !certIssuerError && Array.isArray(certIssuerData)) {
      setCertIssuers(certIssuerData.map((ns) => ns.metadata.name));
    }
  }, [certIssuerData, certIssuerLoaded, certIssuerData]);

  const handleCertIssuerChange = (event) => {
    if (event.currentTarget.value.trim() !== "") {
    setSelectedCertIssuer(event.currentTarget.value);
    setValidatedCertIssuer('success')
    console.log("success check")
    } else {
      setValidatedCertIssuer('error');
      console.log("error check")
    }
  };

  const handleCreateResource = () => {
    handleCreate(tlsPolicyModel, tlsPolicy, selectedNamespace, "TLSPolicy", history);
  };
//   const handleCancelResource = () => {
//     handleCancel(selectedNamespace,"tlsPolicy",tlsPolicy,history);
//   };

  return (
    <>
      <Helmet>
        <title> Create TLS Policy </title>
      </Helmet>
      <Page>
        <PageSection variant="light">
          <Title headingLevel="h1">{('Create TLS Policy')}</Title>
          <div>Description</div>
        </PageSection>
        <PageSection>
          <FormGroup label="Configure via">
            <Flex alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <Radio
                  label="Form View"
                  isChecked={view === 'form'}
                  onChange={() => setView('form')}
                  id="form-view"
                  name="view-toggle"
                />
              </FlexItem>
              <FlexItem>
                <Radio
                  label="YAML View"
                  isChecked={view === 'yaml'}
                  onChange={() => setView('yaml')}
                  id="yaml-view"
                  name="view-toggle"
                />
              </FlexItem>
            </Flex>
          </FormGroup>
        </PageSection>
        {view === 'form' ? (
          <PageSection>

            <Form>

              <FormGroup
                label="Policy name"
                isRequired
                fieldId="simple-form-policy-name-01"
              >
                <TextInput
                  validated={validatedName} 
                  isRequired
                  type="text"
                  id="simple-form-policy-name-01"
                  name="simple-form-policy-name-01"
                  aria-describedby="simple-form-policy-name-01-helper"
                  value={policyName}
                  onChange={handleNameChange}
                  onBlur={() => {
                    if (policyName.trim() === "") {
                      setValidatedName('error');
                    }
                  }}
                />
                {validatedName === 'error' && (
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem icon={<ExclamationCircleIcon />} variant="error">
                        Required
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                )}
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>Unique name of the TLSPolicy.</HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>
              <NamespaceSelect
                selectedNamespace={selectedNamespace}
                onChange={setSelectedNamespace}>
              </NamespaceSelect>
              <FormGroup label="Gateway API Target Reference" fieldId="gateway-select" isRequired>
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      Reference to a Kubernetes resource that the policy attaches to. To create an additional gateway got to
                      <Link to="/k8s/cluster/gateway.networking.k8s.io~v1~Gateway/~new"> here</Link>
                    </HelperTextItem>
                  </HelperText >
                </FormHelperText>
                <FormSelect
                  id="gateway-select"
                  value={selectedGateway}
                  onChange={handleGatewayChange}
                  aria-label="Select Gateway"
                  validated={validatedGateway}
                  onBlur={() => {
                    if (selectedGateway.trim() === "") {
                      setValidatedGateway('error');
                    }
                  }}
                >
                  <FormSelectOption key="placeholder" value="" label="Select a Gateway" isPlaceholder />
                  {gateways.map((gateway, index) => (
                    <FormSelectOption key={index} value={gateway} label={gateway} />
                  ))}
                </FormSelect>
                {validatedGateway === 'error' && (
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem icon={<ExclamationCircleIcon />} variant="error">
                        Required
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                )}
              </FormGroup>
              <FormGroup label="CertIssuer Issuer Reference" fieldId="certmanger-select" isRequired>
              <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                    Reference to the issuer for the created certificate. To create an additional Issuer got to
                      <Link to="/k8s/cluster/cert-manager.io~v1~ClusterIssuer/~new"> here</Link>
                    </HelperTextItem>
                  </HelperText >
                </FormHelperText>
                <FormSelect
                  validated={validatedCertIssuer}
                  id="certmanager-select"
                  value={selectedCertIssuer}
                  onChange={handleCertIssuerChange}
                  aria-label="Select CertIssuer"
                  onBlur={() => {
                    // Validate on blur
                    if (selectedCertIssuer.trim() === "") {
                      setValidatedCertIssuer('error');
                    }
                  }}
                >
                  <FormSelectOption key="placeholder" value="" label="Select a Cert Issuer" isPlaceholder />
                  {certIssuers.map((certIssuer, index) => (
                    <FormSelectOption key={index} value={certIssuer} label={certIssuer} />
                  ))}
                </FormSelect>
                {validatedCertIssuer === 'error' && (
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem icon={<ExclamationCircleIcon />} variant="error">
                        Required
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                )}
              </FormGroup>

              <ActionGroup>
                <Button variant="primary" onClick={handleCreateResource} >Submit</Button>
                <Button variant="link" >Cancel</Button>
              </ActionGroup>
            </Form>
          </PageSection>
        ) : (
          <React.Suspense fallback={<div>Loading...</div>}>
            <ResourceYAMLEditor
              initialResource={yamlInput}
              header="Create resource"
              create={true}
              onChange={handleYAMLChange}
            >

            </ResourceYAMLEditor>
          </React.Suspense>
        )}
      </Page>
    </>
  );
};

export default KuadrantTLSPage;

