    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using Newtonsoft.Json;
    using Newtonsoft.Json.Converters;

namespace MapDataApi.Dtos.AgriculturalLand
{
    public partial class PurpleAgriculturalLand
    {
        [JsonProperty("indicator", NullValueHandling = NullValueHandling.Ignore)]
        public Country Indicator { get; set; }

        [JsonProperty("country", NullValueHandling = NullValueHandling.Ignore)]
        public Country Country { get; set; }

        [JsonProperty("countryiso3code", NullValueHandling = NullValueHandling.Ignore)]
        public string Countryiso3Code { get; set; }

        [JsonProperty("date", NullValueHandling = NullValueHandling.Ignore)]
        [JsonConverter(typeof(ParseStringConverter))]
        public long? Date { get; set; }

        [JsonProperty("value")]
        public double? Value { get; set; }

        [JsonProperty("unit", NullValueHandling = NullValueHandling.Ignore)]
        public string Unit { get; set; }

        [JsonProperty("obs_status", NullValueHandling = NullValueHandling.Ignore)]
        public string ObsStatus { get; set; }

        [JsonProperty("decimal", NullValueHandling = NullValueHandling.Ignore)]
        public long? Decimal { get; set; }
    }

    public partial class Country
    {
        [JsonProperty("id", NullValueHandling = NullValueHandling.Ignore)]
        public string Id { get; set; }

        [JsonProperty("value", NullValueHandling = NullValueHandling.Ignore)]
        public string Value { get; set; }
    }

    public partial class FluffyAgriculturalLand
    {
        [JsonProperty("page", NullValueHandling = NullValueHandling.Ignore)]
        public long? Page { get; set; }

        [JsonProperty("pages", NullValueHandling = NullValueHandling.Ignore)]
        public long? Pages { get; set; }

        [JsonProperty("per_page", NullValueHandling = NullValueHandling.Ignore)]
        public long? PerPage { get; set; }

        [JsonProperty("total", NullValueHandling = NullValueHandling.Ignore)]
        public long? Total { get; set; }

        [JsonProperty("sourceid", NullValueHandling = NullValueHandling.Ignore)]
        [JsonConverter(typeof(ParseStringConverter))]
        public long? Sourceid { get; set; }

        [JsonProperty("lastupdated", NullValueHandling = NullValueHandling.Ignore)]
        public DateTimeOffset? Lastupdated { get; set; }
    }


    public partial struct AgriculturalLandUnion
    {
        public FluffyAgriculturalLand FluffyAgriculturalLand;
        public PurpleAgriculturalLand[] PurpleAgriculturalLandArray;

        public static implicit operator AgriculturalLandUnion(FluffyAgriculturalLand FluffyAgriculturalLand) => new AgriculturalLandUnion { FluffyAgriculturalLand = FluffyAgriculturalLand };
        public static implicit operator AgriculturalLandUnion(PurpleAgriculturalLand[] PurpleAgriculturalLandArray) => new AgriculturalLandUnion { PurpleAgriculturalLandArray = PurpleAgriculturalLandArray };
    }

    public class AgriculturalLand
    {
        public static AgriculturalLandUnion[] FromJson(string json) => JsonConvert.DeserializeObject<AgriculturalLandUnion[]>(json, MapDataApi.Dtos.AgriculturalLand.Converter.Settings);
    }

    public static class Serialize
    {
        public static string ToJson(this AgriculturalLandUnion[] self) => JsonConvert.SerializeObject(self, MapDataApi.Dtos.AgriculturalLand.Converter.Settings);
    }

    internal static class Converter
    {
        public static readonly JsonSerializerSettings Settings = new JsonSerializerSettings
        {
            MetadataPropertyHandling = MetadataPropertyHandling.Ignore,
            DateParseHandling = DateParseHandling.None,
            Converters =
            {
                AgriculturalLandUnionConverter.Singleton,
                new IsoDateTimeConverter { DateTimeStyles = DateTimeStyles.AssumeUniversal }
            },
        };
    }

    internal class AgriculturalLandUnionConverter : JsonConverter
    {
        public override bool CanConvert(Type t) => t == typeof(AgriculturalLandUnion) || t == typeof(AgriculturalLandUnion?);

        public override object ReadJson(JsonReader reader, Type t, object existingValue, JsonSerializer serializer)
        {
            switch (reader.TokenType)
            {
                case JsonToken.StartObject:
                    var objectValue = serializer.Deserialize<FluffyAgriculturalLand>(reader);
                    return new AgriculturalLandUnion { FluffyAgriculturalLand = objectValue };
                case JsonToken.StartArray:
                    var arrayValue = serializer.Deserialize<PurpleAgriculturalLand[]>(reader);
                    return new AgriculturalLandUnion { PurpleAgriculturalLandArray = arrayValue };
            }
            throw new Exception("Cannot unmarshal type AgriculturalLandUnion");
        }

        public override void WriteJson(JsonWriter writer, object untypedValue, JsonSerializer serializer)
        {
            var value = (AgriculturalLandUnion)untypedValue;
            if (value.PurpleAgriculturalLandArray != null)
            {
                serializer.Serialize(writer, value.PurpleAgriculturalLandArray);
                return;
            }
            if (value.FluffyAgriculturalLand != null)
            {
                serializer.Serialize(writer, value.FluffyAgriculturalLand);
                return;
            }
            throw new Exception("Cannot marshal type AgriculturalLandUnion");
        }

        public static readonly AgriculturalLandUnionConverter Singleton = new AgriculturalLandUnionConverter();
    }

    internal class ParseStringConverter : JsonConverter
    {
        public override bool CanConvert(Type t) => t == typeof(long) || t == typeof(long?);

        public override object ReadJson(JsonReader reader, Type t, object existingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.Null) return null;
            var value = serializer.Deserialize<string>(reader);
            long l;
            if (Int64.TryParse(value, out l))
            {
                return l;
            }
            throw new Exception("Cannot unmarshal type long");
        }

        public override void WriteJson(JsonWriter writer, object untypedValue, JsonSerializer serializer)
        {
            if (untypedValue == null)
            {
                serializer.Serialize(writer, null);
                return;
            }
            var value = (long)untypedValue;
            serializer.Serialize(writer, value.ToString());
            return;
        }

        public static readonly ParseStringConverter Singleton = new ParseStringConverter();
    }
}
