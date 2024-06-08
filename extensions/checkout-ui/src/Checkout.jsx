import {
  Banner,
  useApi,
  useTranslate,
  reactExtension,
  useCartLines,
  useLanguage,
  Text,
  InlineLayout,
  BlockStack,
  Image,
  Select,
  Stepper,
  Button,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useState } from "react";

export default reactExtension("purchase.checkout.block.render", () => <Extension />);

function Extension() {
  const translate = useTranslate();
  const { extension, shop, localization } = useApi();
  const cartLines = useCartLines();
  const [firstProductId, setFirstProductId] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  let timerEnd;
  const [intervalInstance, setIntervalInstance] = useState(null);
  const [timerText, setTimerText] = useState(null);
  const language = useLanguage();
  const metaSettings = {
    exclude_ordered_products: "on",
    exclude_discounted_products: null,
    discount_type: "percentage",
    discount_amount: "10",
    crossed_out_price: "compare_at_price",
    discount_title: "Recommendations Special",
    free_shipping: null,
    free_text: '<p style="text-align: center;">We thought you may also like these items:</p>',
    recommendations_box__background_color: "rgb(255,255,255)",
    recommendations_box__border: null,
    button: "Buy Now",
    sold_out_text: "Sold Out",
    button__background_color: "rgba(0, 0, 0, 1)",
    button__color: "rgba(255, 255, 255, 1)",
    original_price__color: "rgba(0, 0, 0, 1)",
    discounted_price__color: "rgba(251, 72, 94, 1)",
    slider_color: "rgba(0, 0, 0, 1)",
    quantity_picker__hide_qty: "on",
    variants__hide_variants: "on",
    product_type__hide_pt: null,
    vendor__hide_vendor: null,
    countdown_enabled: true,
    cd_text: "Offer expires in:",
    cd_position: "top",
    cd_style: "1",
    separatorcd1: null,
    cd_days: "0",
    cd_hours: "0",
    cd_minutes: "20",
    cd_seconds: "0",
    separatorcd2: null,
    cd_days_text: "days",
    cd_hours_text: "hours",
    cd_minutes_text: "minutes",
    cd_seconds_text: "seconds",
    separatorcd3: null,
    cd_expired_text: "Offer Expired",
    cd_expired_action: "1",
    product_ids: "",
  };

  const twoDigits = (value) => {
    return value > 9 ? `${ value }` : `0${value}`;
  }

  const intervalHandler = () => {
    const now = new Date();
    const remainingTime = timerEnd.getTime() - now.getTime();
    if(remainingTime > 0) {
      const days = parseInt(remainingTime / 86400000);
      const hours = parseInt((remainingTime % 86400000) / 3600000);
      const minutes = parseInt((remainingTime % 3600000) / 60000);    
      const seconds = parseInt((remainingTime % 60000) / 1000);    
      setTimerText(`${ metaSettings.cd_text }${ days ? ` ${ days } ${ metaSettings.cd_days_text }`: ''}${ hours ? ` ${ twoDigits(hours) } ${ metaSettings.cd_hours_text }`: ''}${ minutes ? ` ${ twoDigits(minutes) } ${ metaSettings.cd_minutes_text }`: ''}${ seconds ? ` ${ twoDigits(seconds) } ${ metaSettings.cd_seconds_text }`: ''}`)
    } else {
      clearInterval(intervalInstance);
      setTimerText(metaSettings.cd_expired_text);
    }
  }

  useEffect(() => {
    const now = new Date();
    const targetTime = new Date(now.getTime() + parseInt(metaSettings.cd_days) * 86400000 + parseInt(metaSettings.cd_hours)  * 3600000 + parseInt(metaSettings.cd_minutes) * 60000 + parseInt(metaSettings.cd_seconds) * 1000);
    timerEnd = targetTime;
    const interval = setInterval(intervalHandler, 500);
    setIntervalInstance(interval);
  }, [])

  useEffect(() => {
    console.log(localization);
    fetchRecommendation = async (productId) => {
      const response = await fetch(`https://pp-stage.heartcoding.de/home/get_recommended_products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shop: "heartcoding.myshopify.com",
          product_id: "4325911986199",
        }),
      });
      if (response.ok) {
        const relatedProducts = await response.json();
        if (metaSettings.exclude_ordered_products === "on") {
          let filteredProducts = relatedProducts.products.filter((product) => {
            for (const line of cartLines) {
              if (line.merchandise.product.id.includes(product.id)) {
                return false;
              }
            }
            return true;
          });
          filteredProducts = filteredProducts.map((product) => {
            return {
              ...product,
              selectedVariant: 0,
            }
          })
          setRelatedProducts(filteredProducts);
        } else {
          const products = relatedProducts.products.map((product) => {
            return {
              ...product,
              selectedVariant: 0,
            }
          });
          setRelatedProducts(products);
        }
      }
    };
    console.log(shop);
    if (cartLines.length) {
      const productId = cartLines[0].merchandise.product.id.replace("gid://shopify/Product/", "");
      console.log(productId);
      setFirstProductId(productId);
      fetchRecommendation(productId);
    }
  }, [cartLines]);

  const formatMoney = (price) => {
    let currencyConverter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: localization ? localization.currency.current.isoCode : 'USD',
    });

    return currencyConverter.format(price/100);
  }

  const handleVariantChange = (value, index) => {
    let product = relatedProducts[index];
    for(let i = 0; i < product.variants.length; i++) {
      if(product.variants[i].id == value) {
        let products = relatedProducts;
        products[index].selectedVariant = i;
        setRelatedProducts(JSON.parse(JSON.stringify(products)));
      }
    }
  }



  return relatedProducts.length ? (
    <BlockStack inlineAlignment="center" spacing="loose" padding={["loose", "none"]}>
      { metaSettings.countdown_enabled && metaSettings.cd_position === 'top' ? <Text size="medium">{ timerText }</Text> : null}
      <Text size="medium">{ metaSettings.free_text? metaSettings.free_text.replace(/(<([^>]+)>)/gi, "") : "" }</Text>
      { metaSettings.countdown_enabled && metaSettings.cd_position === 'below_text' ? <Text size="medium">{ timerText }</Text> : null}
      <InlineLayout columns="3" spacing="base">
        {relatedProducts.map((product, index) => (
          <BlockStack spacing="base" key={index}>
            <Image source={product.featured_image} />
            <Text size="large" appearance="accent">{product.title}</Text>
            <Text>{formatMoney(product.variants[product.selectedVariant].price)}</Text>
            {
              metaSettings.variants__hide_variants === "on" ? null: (
                <Select
                  label="Variant"
                  value={product.variants[product.selectedVariant].id}
                  options={product.variants.map((variant) => {
                    return {
                      value: variant.id,
                      label: variant.title,
                    };
                  })}
                  onChange={(value) => handleVariantChange(value, index)}
                />
              )
            }
            
            {
              metaSettings.quantity_picker__hide_qty === "on" ? null: <Stepper label="Quantity" value={1} />
            }

            <Button
              onPress={() => {
                console.log("onPress event");
              }}
              disabled={!product.variants[product.selectedVariant].available}
            >
              { product.variants[product.selectedVariant].available? metaSettings.button : metaSettings.sold_out_text }
            </Button>
          </BlockStack>
        ))}
      </InlineLayout>
      { metaSettings.countdown_enabled && metaSettings.cd_position === 'bottom' ? <Text size="medium">{ timerText }</Text> : null}
    </BlockStack>
    
  ) : (
    <></>
  );
}
